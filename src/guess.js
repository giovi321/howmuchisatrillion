import gsap from 'gsap'

const TRUE_FRAC = (1e9 - 1e6) / (1e12 - 1e6) // ≈ 0.000999

function money(v) {
  if (v >= 1e12) return `€${(v / 1e12).toFixed(1)} trillion`
  if (v >= 1e9) return `€${(v / 1e9).toFixed(0)} billion`
  return `€${(v / 1e6).toFixed(0)} million`
}

export function setupGuess() {
  const line = document.getElementById('numberline')
  const guess = document.getElementById('nlGuess')
  const truth = document.getElementById('nlTruth')
  const hint = document.getElementById('guessHint')
  const verdict = document.getElementById('guessVerdict')
  const big = document.getElementById('verdictBig')
  let revealed = false
  let guessFrac = null

  function place(clientX) {
    if (revealed) return
    const r = line.getBoundingClientRect()
    guessFrac = Math.min(0.99, Math.max(0.0, (clientX - r.left) / r.width))
    sessionStorage.setItem('guessFrac', String(guessFrac))
    guess.style.left = `${guessFrac * 100}%`
    guess.classList.add('placed')
    gsap.fromTo(guess, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.5)' })
    hint.textContent = 'locked in. now scroll for the truth ↓'
    setTimeout(reveal, 900)
  }

  function reveal() {
    if (revealed) return
    revealed = true
    truth.classList.add('placed')
    gsap.fromTo(truth,
      { left: '50%', opacity: 0 },
      { left: `${TRUE_FRAC * 100}%`, opacity: 1, duration: 1.4, ease: 'power4.inOut' })
    gsap.fromTo(verdict, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: 1.1 })
    gsap.to(hint, { opacity: 0, duration: 0.3 })

    if (guessFrac != null) {
      const value = 1e6 + guessFrac * (1e12 - 1e6)
      const ratio = value / 1e9
      if (ratio >= 0.5 && ratio <= 2) {
        big.textContent = `You guessed ${money(value)}. Scarily close — almost nobody gets this right.`
      } else if (ratio > 1) {
        big.textContent = `You tapped ${money(value)} — ${Math.round(ratio).toLocaleString('en-US')}× too big.`
      } else {
        big.textContent = `You tapped ${money(value)} — under by ${Math.round(1 / ratio).toLocaleString('en-US')}×.`
      }
    } else {
      big.textContent = 'Most people tap near the middle. The middle is half a trillion.'
    }
  }

  line.addEventListener('pointerdown', (e) => place(e.clientX))
  window.__revealTruth = reveal
}
