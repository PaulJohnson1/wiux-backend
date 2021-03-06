import Entity from "../../Entity";
import BaseEntity from "../../BaseEntity";
import Game from "../../../Game";
import RopeSegment from "./RopeSegment";
import Player from "../Player";
import Vector from "../../../Vector";
import { Writer } from "../../../Coder";

export default class Rope extends BaseEntity {
  public k: number;
  public length: number;
  public segments: Set<BaseEntity>;
  public owner: BaseEntity;

  constructor(game: Game, entity1: BaseEntity, entity2: BaseEntity, length: number, springConstant: number, restLength: number) {
    super(game);

    this.length = length;
    this.k = springConstant;
    this.restLength = restLength;
    this.owner = entity1;

    this.detectsCollision = false;

    this.segments = new Set([this.owner]);

    for (let i = 0; i < this.length; i++) {
      const ropeSegment = new RopeSegment(this.game, this);

      ropeSegment.restLength = this.restLength;

      this.segments.add(ropeSegment);
    }

    this.segments.add(entity2);
  }

  /** @ts-ignore */
  get position() {
    return this.owner.position;
  }

  /** @ts-ignore */
  set position(a: any) {}

  writeBinary(writer: Writer, isCreation: boolean) {
    if (isCreation) {
      writer.vu(2);

      writer.vu(this.segments.size);
    }

    this.segments.forEach(segment => {
      writer.vi(segment.position.x);
      writer.vi(segment.position.y);
    });
  }

  terminate() {
    super.terminate();

    this.segments.forEach(segment => {
      if (segment instanceof RopeSegment) segment.terminate();
    });
  }

  tick(tick: number) {
    const segments = Array.from(this.segments);

    for (let i = 1; i < segments.length; i++) {
      const a = segments[i - 1];
      const b = segments[i];

      const delta = a.position.subtract(b.position);
      const x = delta.mag - Math.max(a.restLength, b.restLength);
      
      let force = delta.unitVector.scale(-this.k * x);
      
      if (a.isAffectedByRope) a.applyAcceleration(force.x, force.y, false);
      
      force = force.scale(-1);

      if (b.isAffectedByRope) b.applyAcceleration(force.x, force.y, false);
    }
  }
}
