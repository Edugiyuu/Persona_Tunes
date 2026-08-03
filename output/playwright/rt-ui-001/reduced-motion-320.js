async (page) => {
  const context = page.context()
  await page.setViewportSize({ width: 320, height: 568 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await context.route('**/star.svg', async (route) => {
    await route.fulfill({
      body: 'unavailable',
      contentType: 'text/plain',
      status: 503,
    })
  })
  await page.reload()
  await page.getByRole('button', { name: 'Retry startup' }).waitFor()
  const metrics = await page.evaluate(() => {
    const art = document.querySelector('.loadingScreen__art')
    const button = document.querySelector('.loadingScreen__button')
    const panel = document.querySelector('.loadingScreen__panel')
    return {
      activeElement: document.activeElement?.textContent?.trim() ?? null,
      artAnimation: art ? getComputedStyle(art).animationName : null,
      bodyScrollWidth: document.body.scrollWidth,
      buttonTransition: button
        ? getComputedStyle(button).transitionDuration
        : null,
      documentScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      panelAnimation: panel ? getComputedStyle(panel).animationName : null,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    }
  })
  await context.unroute('**/star.svg')
  await page
    .getByRole('button', { name: 'Continue without optional resources' })
    .click()
  await page.getByRole('link', { name: 'SELECT MUSIC' }).waitFor()
  return {
    metrics,
    recoveredHomeLinks: await page.getByRole('link').count(),
  }
}
