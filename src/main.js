import './style.css'

const demos = {
  'bouncing-balls': {
    name: 'Bouncing Balls',
    desc: 'Jolt physics + Three.js — 20 spheres with restitution, shadow maps, orbit controls',
    load: () => import('./demos/bouncing-balls.js'),
  },
}

const app = document.getElementById('app')

function renderLanding() {
  document.title = 'a-physx-sandbox'
  const items = Object.entries(demos)
    .map(([slug, { name, desc }], i) => {
      const num = String(i + 1).padStart(2, '0')
      return `<li><a href="#${slug}"><span class="num">${num}.</span><span class="name">${name}</span><span class="desc">— ${desc}</span></a></li>`
    })
    .join('')

  app.className = 'landing'
  app.innerHTML = `<ol class="landing-list">${items}</ol>`
}

async function loadDemo(slug) {
  const demo = demos[slug]
  if (!demo) {
    window.location.hash = ''
    return
  }

  document.title = `${demo.name} — a-physx-sandbox`
  app.className = ''
  app.innerHTML = '<a class="demo-back" href="#">&larr; index</a>'

  const mod = await demo.load()
  await mod.default(app)
}

function handleHash() {
  const slug = window.location.hash.slice(1)
  if (slug) {
    loadDemo(slug)
  } else {
    renderLanding()
  }
}

window.addEventListener('hashchange', () => {
  window.location.reload()
})

handleHash()
