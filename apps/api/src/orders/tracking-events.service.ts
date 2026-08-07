import { Injectable } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export type TrackingLiveEvent = {
  orderId: string;
  type: 'tracking' | 'status' | 'courier_gps';
  payload: Record<string, unknown>;
  at: string;
};

@Injectable()
export class TrackingEventsService {
  private readonly bus = new Subject<TrackingLiveEvent>();

  emit(event: Omit<TrackingLiveEvent, 'at'>) {
    this.bus.next({ ...event, at: new Date().toISOString() });
  }

  stream(orderId: string): Observable<MessageEvent> {
    return this.bus.asObservable().pipe(
      filter((e) => e.orderId === orderId),
      map(
        (e) =>
          ({
            data: e,
          }) as MessageEvent,
      ),
    );
  }
}
