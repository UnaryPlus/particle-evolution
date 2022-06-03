import clone from 'clone'
import p5 from 'p5'

import { p, env, gen, mut } from './global'
import { Particle, randomForce, randomParticle, mutateParticle } from './particle'

export default class Creature {
  readonly particles:Particle[]
  readonly domain:number
  readonly fitness:number
  trialParticles:Particle[]

  constructor(particles:Particle[], domain:number) {
    this.particles = particles
    this.domain = domain
    this.trialParticles = clone(particles)
    for(let i = 0; i < 600; i++) {
      this.update()
    }
    this.fitness = this.currentFitness()
    this.reset()
  }

  static random(domain:number) : Creature {
    const n = p.floor(p.random(gen.minParticles, gen.maxParticles + 1))
    const particles:Particle[] = Array.from({ length:n }, () => randomParticle(n))
    return new Creature(particles, domain)
  }

  static mutate(cr:Creature) : Creature {
    const particles = cr.particles.map((pt:Particle) =>
      mutateParticle(pt))
    if(p.random() < mut.deletionProb && particles.length > gen.minParticles) {
      const index = p.floor(p.random(particles.length))
      particles.splice(index, 1)
      particles.forEach((pt:Particle) => pt.forces.splice(index, 1))
    }
    if(p.random() < mut.additionProb && particles.length < gen.maxParticles) {
      const newPt = randomParticle(particles.length + 1)
      particles.forEach((pt:Particle) => pt.forces.push(randomForce()))
      particles.push(newPt)
    }
    return new Creature(particles, cr.domain)
  }

  reset() : void {
    this.trialParticles = clone(this.particles)
  }

  update() : void {
    const accelerations:p5.Vector[] = []
    for(let i = 0; i < this.trialParticles.length; i++) {
      const pt = this.trialParticles[i]
      const acc = p.createVector(0, 0)
      for(let j = 0; j < this.trialParticles.length; j++) {
        if(i === j) continue
        const pt2 = this.trialParticles[j]
        const force = pt.forces[j]
        const dist = p5.Vector.sub(pt2.pos, pt.pos)
        if(dist.mag() > force.minRadius && dist.mag() < force.maxRadius) {
          dist.setMag(force.attraction)
          acc.add(dist)
        }
      }
      accelerations.push(acc)
    }

    for(let i = 0; i < this.trialParticles.length; i++) {
      const pt = this.trialParticles[i]
      pt.vel.add(accelerations[i])
      pt.vel.mult(1 - env.friction)
      pt.pos.add(pt.vel)
    }
  }

  currentFitness() : number {
    const sum = p.createVector(0, 0)
    for(let i = 0; i < this.particles.length; i++) {
      sum.add(p5.Vector.sub(this.trialParticles[i].pos, this.particles[i].pos))
    }
    return sum.mag()


    /*
    const oldCenter = findCenter(this.particles)
    const newCenter = findCenter(this.trialParticles)
    const dist = p5.Vector.dist(oldCenter, newCenter)
    return dist * this.particles.length ** env.massPower
    */
  }

  display(x:number, y:number, size:number, deleted:boolean) : void {
    const scale = size / gen.creatureSize
    this.trialParticles.forEach((pt:Particle) => {
      p.fill(deleted ? 225 : 0)
      p.noStroke()
      p.circle(pt.pos.x * scale + x, pt.pos.y * scale + y, 10 * scale)
    })
  }
}