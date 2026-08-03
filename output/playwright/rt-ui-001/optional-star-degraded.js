async (page) => {
  let starRequests = 0
  await page.route('**/star.svg', async (route) => {
    starRequests += 1
    await route.fulfill({ status: 503, body: 'temporarily unavailable' })
  })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page
    .getByRole('button', { name: 'Continue without optional resources' })
    .click()
  await page.getByRole('link', { name: 'SELECT MUSIC' }).waitFor()

  const degraded = {
    homeLinks: await page.getByRole('link', { name: 'SELECT MUSIC' }).count(),
    starImages: await page.locator('img.star').count(),
    starRequests,
  }

  await page.unrouteAll({ behavior: 'wait' })
  return degraded
}
