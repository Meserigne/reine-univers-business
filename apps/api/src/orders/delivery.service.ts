import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type RouteEstimate = {
  distanceMeters: number;
  durationSeconds: number;
  destLat: number;
  destLng: number;
  storeLat: number;
  storeLng: number;
  source: 'google' | 'estimate' | 'zone' | 'gps';
  mapsUrl: string;
  zoneId?: string;
  zoneName?: string;
  deliveryFee: number;
  prepSeconds: number;
};

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.deliverySettings.upsert({
      where: { id: 'main' },
      create: {
        id: 'main',
        defaultPrepMinutes: 8,
        defaultDurationMinutes: 25,
        defaultFee: 0,
        useMapsEstimate: true,
      },
      update: {},
    });
  }

  async updateSettings(data: {
    defaultPrepMinutes?: number;
    defaultDurationMinutes?: number;
    defaultFee?: number;
    useMapsEstimate?: boolean;
  }) {
    await this.getSettings();
    return this.prisma.deliverySettings.update({
      where: { id: 'main' },
      data,
    });
  }

  async pickCourier(seed: string) {
    const available = await this.prisma.courier.findMany({
      where: { active: true, available: true },
      orderBy: { sortOrder: 'asc' },
    });
    const pool =
      available.length > 0
        ? available
        : await this.prisma.courier.findMany({
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
          });

    if (!pool.length) {
      return {
        id: null as string | null,
        name: 'Livreur à assigner',
        phone: null as string | null,
      };
    }

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash + seed.charCodeAt(i) * (i + 1)) % pool.length;
    }
    const c = pool[hash];
    return { id: c.id, name: c.name, phone: c.phone };
  }

  async matchZone(address: string) {
    const zones = await this.prisma.deliveryZone.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    const hay = address.toLowerCase();
    for (const zone of zones) {
      const keys = zone.keywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      if (keys.some((k) => hay.includes(k))) {
        return zone;
      }
    }
    return null;
  }

  async estimateRoute(
    address: string,
    clientCoords?: { lat: number; lng: number } | null,
  ): Promise<RouteEstimate> {
    const settings = await this.getSettings();
    const zone = await this.matchZone(address);
    const storeLat = Number(process.env.STORE_LAT ?? 14.7167);
    const storeLng = Number(process.env.STORE_LNG ?? -17.4677);
    const storeLabel = process.env.STORE_ADDRESS ?? 'Dakar, Sénégal';
    const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

    const prepSeconds =
      (zone?.prepMinutes ?? settings.defaultPrepMinutes) * 60;
    const deliveryFee = zone?.fee ?? settings.defaultFee;
    const zoneDurationSeconds =
      (zone?.durationMinutes ?? settings.defaultDurationMinutes) * 60;

    const hasClientGps =
      clientCoords &&
      Number.isFinite(clientCoords.lat) &&
      Number.isFinite(clientCoords.lng);

    // Client GPS pin: most accurate destination for the courier
    if (hasClientGps) {
      const destLat = clientCoords.lat;
      const destLng = clientCoords.lng;
      let distanceMeters = Math.round(
        this.haversineMeters(storeLat, storeLng, destLat, destLng),
      );
      let durationSeconds = zone
        ? zoneDurationSeconds
        : Math.max(
            8 * 60,
            Math.round((distanceMeters / 1000 / 22) * 3600) + 180,
          );
      // Keep source 'gps' so courier UI knows pin is client's live location
      const source: RouteEstimate['source'] = 'gps';

      if (settings.useMapsEstimate && apiKey) {
        try {
          const google = await this.googleDistance(
            apiKey,
            storeLabel,
            `${destLat},${destLng}`,
          );
          if (google) {
            distanceMeters = google.distanceMeters;
            durationSeconds = zone
              ? zoneDurationSeconds
              : google.durationSeconds;
          }
        } catch (err) {
          this.logger.warn(`Google Maps (GPS dest) failed: ${String(err)}`);
        }
      }

      return {
        distanceMeters,
        durationSeconds,
        destLat,
        destLng,
        storeLat,
        storeLng,
        source,
        mapsUrl: this.buildMapsUrl(storeLat, storeLng, address, destLat, destLng),
        zoneId: zone?.id,
        zoneName: zone?.name,
        deliveryFee,
        prepSeconds,
      };
    }

    // Zone-only mode: fixed times by zone
    if (!settings.useMapsEstimate) {
      const dest = await this.geocodeFallback(address, storeLat, storeLng);
      const distanceMeters = Math.round(
        this.haversineMeters(storeLat, storeLng, dest.lat, dest.lng),
      );
      return {
        distanceMeters,
        durationSeconds: zoneDurationSeconds,
        destLat: dest.lat,
        destLng: dest.lng,
        storeLat,
        storeLng,
        source: 'zone',
        mapsUrl: this.buildMapsUrl(
          storeLat,
          storeLng,
          address,
          dest.lat,
          dest.lng,
        ),
        zoneId: zone?.id,
        zoneName: zone?.name,
        deliveryFee,
        prepSeconds,
      };
    }

    if (apiKey) {
      try {
        const google = await this.googleDistance(apiKey, storeLabel, address);
        if (google) {
          return {
            ...google,
            // Prefer zone duration if zone matched (business rule), else maps
            durationSeconds: zone
              ? zoneDurationSeconds
              : google.durationSeconds,
            storeLat,
            storeLng,
            source: zone ? 'zone' : 'google',
            mapsUrl: this.buildMapsUrl(
              storeLat,
              storeLng,
              address,
              google.destLat,
              google.destLng,
            ),
            zoneId: zone?.id,
            zoneName: zone?.name,
            deliveryFee,
            prepSeconds,
          };
        }
      } catch (err) {
        this.logger.warn(`Google Maps failed, fallback: ${String(err)}`);
      }
    }

    const dest = await this.geocodeFallback(address, storeLat, storeLng);
    const distanceMeters = Math.round(
      this.haversineMeters(storeLat, storeLng, dest.lat, dest.lng),
    );
    const estimated = Math.max(
      8 * 60,
      Math.round((distanceMeters / 1000 / 22) * 3600) + 180,
    );

    return {
      distanceMeters,
      durationSeconds: zone ? zoneDurationSeconds : estimated,
      destLat: dest.lat,
      destLng: dest.lng,
      storeLat,
      storeLng,
      source: zone ? 'zone' : 'estimate',
      mapsUrl: this.buildMapsUrl(
        storeLat,
        storeLng,
        address,
        dest.lat,
        dest.lng,
      ),
      zoneId: zone?.id,
      zoneName: zone?.name,
      deliveryFee,
      prepSeconds,
    };
  }

  buildMapsUrl(
    storeLat: number,
    storeLng: number,
    address: string,
    destLat?: number | null,
    destLng?: number | null,
  ) {
    const origin = `${storeLat},${storeLng}`;
    const dest =
      destLat != null && destLng != null
        ? `${destLat},${destLng}`
        : encodeURIComponent(address);
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  }

  navigationUrl(destLat: number, destLng: number) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
  }

  private async googleDistance(
    apiKey: string,
    origin: string,
    destination: string,
  ) {
    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      mode: 'driving',
      language: 'fr',
      region: 'sn',
      key: apiKey,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      rows?: Array<{
        elements: Array<{
          status: string;
          distance?: { value: number };
          duration?: { value: number };
        }>;
      }>;
    };
    const element = data.rows?.[0]?.elements?.[0];
    if (data.status !== 'OK' || element?.status !== 'OK') return null;

    const geo = await this.googleGeocode(apiKey, destination);
    return {
      distanceMeters: element.distance!.value,
      durationSeconds: element.duration!.value,
      destLat: geo?.lat ?? Number(process.env.STORE_LAT ?? 14.7167),
      destLng: geo?.lng ?? Number(process.env.STORE_LNG ?? -17.4677),
    };
  }

  private async googleGeocode(apiKey: string, address: string) {
    const q =
      /dakar|sénégal|senegal/i.test(address)
        ? address
        : `${address}, Dakar, Sénégal`;
    const params = new URLSearchParams({
      address: q,
      region: 'sn',
      components: 'country:SN',
      key: apiKey,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
    };
    if (data.status !== 'OK' || !data.results?.[0]) return null;
    return data.results[0].geometry.location;
  }

  private async geocodeFallback(
    address: string,
    fallbackLat: number,
    fallbackLng: number,
  ) {
    try {
      const q =
        /dakar|sénégal|senegal/i.test(address)
          ? address
          : `${address}, Dakar, Sénégal`;
      const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
        {
          q,
          format: 'json',
          limit: '1',
          countrycodes: 'sn',
          viewbox: '-17.58,14.92,-17.20,14.55',
          bounded: '1',
        },
      )}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'ReineUniversBusiness/1.0 (delivery-eta)',
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (data[0]) {
          return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
        }
      }
    } catch (err) {
      this.logger.warn(`Nominatim geocode failed: ${String(err)}`);
    }

    // Fallback near Dakar centre (not random worldwide)
    let hash = 0;
    for (let i = 0; i < address.length; i++) hash += address.charCodeAt(i);
    const offsetKm = 0.8 + (hash % 40) / 10;
    const angle = ((hash % 360) * Math.PI) / 180;
    const dLat = (offsetKm / 111) * Math.cos(angle);
    const dLng =
      (offsetKm / (111 * Math.cos((fallbackLat * Math.PI) / 180))) *
      Math.sin(angle);
    return { lat: fallbackLat + dLat, lng: fallbackLng + dLng };
  }

  private haversineMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  formatDistance(meters: number) {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
  }
}
