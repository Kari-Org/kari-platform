import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * A designated stop on a route, ordered by `sequence`. `fareFromOrigin` is the
 * cumulative fare (naira) from the route's first stop, so a leg's price is the
 * difference between the two stops' values.
 */
@Entity('shuttle_stops')
export class ShuttleStop extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  routeId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ type: 'int' })
  fareFromOrigin: number;
}
