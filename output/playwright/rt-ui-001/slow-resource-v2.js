async (page) => {
  await page.route('**/star.svg', async (route) => {
    await page.waitForTimeout(3000)
    await route.continue()
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(150)
  const pending = {
    status: await page.getByRole('status').textContent(),
    homeLinks: await page.getByRole('link').count(),
  }
  await page.waitForTimeout(3300)
  const ready = {
    statusCount: await page.getByRole('status').count(),
    homeLinks: await page.getByRole('link').count(),
  }
  await page.unroute('**/star.svg')
  return { pending, ready }
}
