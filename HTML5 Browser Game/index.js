const canvas = document.querySelector('canvas');
//change the size of the canvas to fit the window
canvas.width = innerWidth
canvas.height = innerHeight

const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')
const startGameBtn =  document.querySelector('#startGameBtn')
const modalEl =  document.querySelector('#modalEl')
const bigScoreEl = document.querySelector('#bigScoreEl')


class Player {
    constructor(x,y,radius,color){
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
    }
    //Draws a circle
    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color
        c.fill()
    }
}

class Projectile {
    constructor(x,y,radius,color,velocity){
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }
    //Draws a circle
    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}


class Enemy {
    constructor(x,y,radius,color,velocity){
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }
    //Draws a circle
    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

const friction = 0.99
class Particle {
    constructor(x,y,radius,color,velocity){
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }
    //Draws a circle
    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *=friction
        this.velocity.y *=friction
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01
    }
}



const x =  canvas.width/2
const y =  canvas.height/2

let player =  new Player(x,y,10,'white')
let projectiles = []
let enemies = []
let particles = []


function init() {
    player =  new Player(x,y,10,'white')
    projectiles = []
    enemies = []
    particles = []
    score = 0
    scoreEl.innerHTML = score
    bigScoreEl.innerHTML = score
}

function spawnEnemies() {
    setInterval(() => {
        const radius = (Math.random() * (30-4)) +4 
        let x
        let y

        //the ? is a ternary operator meaning this value is conditional
        if (Math.random() < 0.5){
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height  
        } else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        }
        //the back ticks ` and the ${} make the calculation 
        //be computed in the one line also known as a template literate
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`
        const angle = Math.atan2(canvas.height /2 - y, canvas.width/2 - x)
        const velocity = {x:Math.cos(angle),y:Math.sin(angle)}
        enemies.push(new Enemy(x,y,radius,color,velocity))        
        //console.log(enemies)
    }, 1000)
}

let animationId
let score = 0
function animate() { 
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0,0,0, 0.1)'
    c.fillRect(0,0,canvas.width, canvas.height)
    player.draw()
    particles.forEach((particle,particleindex) => {
        if (particle.alpha <= 0) {
            particles.splice(particleindex,1)
        } else {
            particle.update()  
        }
    });

    projectiles.forEach((projectile, projectileindex)=> {
         projectile.update()
         //despawn projectiles when off screen
         if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height)
        {
            setTimeout(() => {
                projectiles.splice(projectileindex, 1)
            }, 0)
         }
    })

    enemies.forEach((enemy,index) => {
        enemy.update()
        //player and enemy collision
        const dist = Math.hypot(player.x - enemy.x,
            player.y - enemy.y)
        //end game
        if (dist - enemy.radius - player.radius +5 < 1) {
            cancelAnimationFrame(animationId)
            modalEl.style.display = 'flex'
            bigScoreEl.innerHTML = score
        }

        //collision
        projectiles.forEach((projectile,projectileindex) => {
            const dist = Math.hypot(projectile.x - enemy.x,
                 projectile.y - enemy.y)

            // when projectiles touch enemy     
            if (dist - enemy.radius - projectile.radius < 1) 
            {
                //increase our score
                score += 100
                scoreEl.innerHTML = score

                //create particle explosions
                for (let i = 0; i  < enemy.radius * 2; i++){
                    particles.push(
                        new Particle(projectile.x,
                        projectile.y, Math.random() * 2, enemy.color, {x: (Math.random() - 0.5) * 6 ,
                        y: (Math.random() - 0.5) * 6
                    }))
                }

                if(enemy.radius -10 > 5) {
                    gsap.to(enemy,{
                        radius: enemy.radius - 10
                    })
                    //enemy.radius -= 10
                    setTimeout(() => {
                        projectiles.splice(projectileindex, 1)},0)
                } else {
                //setTimeout Stops the flashing
                setTimeout(() => {
                    enemies.splice(index, 1)
                    projectiles.splice(projectileindex, 1)
                }, 0)
                score += 150
                scoreEl.innerHTML = score
            }
                
            }
        })
    })
}

//Create Projectile on click
addEventListener('click', (event)=> {
    //Note:angles are in radians
    const angle = Math.atan2(event.clientY -canvas.height /2, event.clientX - canvas.width/2)
    const velocity = {x:Math.cos(angle) *5 ,y:Math.sin(angle) *5}
    projectiles.push(new Projectile(canvas.width/2, canvas.height/2, 5, 'white',
    velocity))
})

startGameBtn.addEventListener('click', () => {
    init()
    animate()
    spawnEnemies()
    modalEl.style.display = 'none'
})
