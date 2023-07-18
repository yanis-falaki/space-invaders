class Enemy extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, sprite, laserSprite, timeToShoot, damage, laserSpeed, health, score, isWave) {
      super(scene, x, y, sprite);
      this.scene = scene
      this.setScale(0.65)
      scene.add.existing(this);
      scene.physics.world.enable(this);
      this.minTime = timeToShoot[0]
      this.maxTime = timeToShoot[1]
      this.laserSprite = laserSprite
      this.damage = damage
      this.laserSpeed = laserSpeed
      this.health = health
      this.score = score
      this.isWave = isWave
  }

  travelling = false
  targetPosition
  threshold = 15
  waypointQueue = []
  waitingToShoot = true
  firstShot = true
  isPositive = [false, false]

  // Found out that there's a tween function which could've simplified the movement, but I already made this.
  goTo(targetX, targetY, duration) {
      this.travelling = true
      const startPosition = new Phaser.Math.Vector2(this.x, this.y);
      const targetPositionVector = new Phaser.Math.Vector2(targetX, targetY);
      const distance = Phaser.Math.Distance.BetweenPoints(startPosition, targetPositionVector);
      const velocity = distance / duration;
      const direction = targetPositionVector.subtract(startPosition).normalize();
      this.body.setVelocity(direction.x * velocity, direction.y * velocity);
      this.targetPosition = [targetX, targetY]
      if (this.x - targetX > 0) { this.isPositive[0] = true } else { this.isPositive[0] = false }
      if (this.y - targetY > 0) { this.isPositive[1] = true } else { this.isPositive[1] = false }
  }

  queueWaypoint(waypoint) {
      this.waypointQueue.push([waypoint.x, waypoint.y, waypoint.speed])
  }

  checkWaypoints() {
      if (this.travelling == false && this.waypointQueue.length > 0) {
      // waypointQueue is an array of waypoints, who themselves are arrays containing x, y, and speed elements
      this.goTo(this.waypointQueue[0][0], this.waypointQueue[0][1], this.waypointQueue[0][2])
      this.waypointQueue.shift()
      }
  }

  checkIfPast() {
  // Need to use JSON.stringify() because switch statement uses strict comparison
  if (this.travelling == true)
  {
      switch (JSON.stringify(this.isPositive))
      {
      case JSON.stringify([false, false]):
          if (this.x - this.targetPosition[0] >= -3 && this.y - this.targetPosition[1] >= -3) {
          this.body.setVelocity(0, 0)
          this.travelling = false
          }
          break
      case JSON.stringify([false, true]):
          if (this.x - this.targetPosition[0] >= -3 && this.y - this.targetPosition[1] <= 3) {
          this.body.setVelocity(0, 0)
          this.travelling = false
          }
          break
      case JSON.stringify([true, false]):
          if (this.x - this.targetPosition[0] <= 3 && this.y - this.targetPosition[1] >= -3) {
          this.body.setVelocity(0, 0)
          this.travelling = false
          }
          break
      case JSON.stringify([true, true]):
          if (this.x - this.targetPosition[0] <= 3 && this.y - this.targetPosition[1] <= 3) {
          this.body.setVelocity(0, 0)
          this.travelling = false
          }
          break
      }
    }
  }

  update() {
      this.checkIfPast()
      this.checkWaypoints()

      // Shooting logic
      if (this.firstShot) {
      setTimeout(() => this.waitingToShoot = false, Phaser.Math.Between(400, 1000))
      this.firstShot = false
      }

      if (!this.waitingToShoot) {
      this.waitingToShoot = true
      this.shoot()
      setTimeout(() => this.waitingToShoot = false, Phaser.Math.Between(this.minTime, this.maxTime) * 1000)
      }

      // Self-destruct when finished wave
      if (this.isWave == true && this.waypointQueue.length === 0 && !this.travelling) {
      this.destroy();
      }
  }

  shoot() {
      let scene = this.scene
      let laser = scene.add.sprite(this.x, this.y + 30, this.laserSprite).setScale(1, -1).setScale(0.65)
      laser.damage = this.damage
      scene.physics.add.existing(laser)
      scene.enemyLasers.add(laser)
      laser.body.velocity.y = this.laserSpeed
  }

  hit(damage) {
      let scene = this.scene
      this.health -= damage
      if (this.health <= 0) {
      let explosionSprite = scene.add.sprite(this.x, this.y, 'explosion_1').setScale(0.25)
      explosionSprite.play('explosion', false)
      explosionSprite.once('animationcomplete', () => {
          explosionSprite.destroy()
      })
      scene.explodeEnemySound.play()
      scene.score += this.score
      scene.scoreText.text = 'Score: ' + scene.score
      this.destroy()
      } else { scene.blipSound.play() }
  }
}
  
export class EnemyRed extends Enemy {
constructor(scene, x, y, isWave=false) {
    super(scene, x, y, 'enemyRed', 'laserRed', [1, 5], 10, 500, 10, 10, isWave)
}
}

export class EnemyBlue extends Enemy {
constructor(scene, x, y, isWave=false) {
    super(scene, x, y, 'enemyBlue', 'laserBlue', [1, 6], 20, 800, 20, 20, isWave)
}
}