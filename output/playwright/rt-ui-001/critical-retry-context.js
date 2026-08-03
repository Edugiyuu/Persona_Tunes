async (page) => {
  const context = page.context()
  await context.route('**/*Faktos*.ttf', async (route) => {
    await route.fulfill({
      body: 'unavailable',
      contentType: 'text/plain',
      status: 503,
    })
  })
  await page.reload()
  const retry = page.getByRole('button', { name: 'Retry startup' })
  await retry.waitFor()
  const failed = {
    activeElement: await page.evaluate(
      () => document.activeElement?.textContent?.trim() ?? null,
    ),
    continueButtons: await page
      .getByRole('button', { name: 'Continue without optional resources' })
      .count(),
    homeLinks: await page.getByRole('link').count(),
    status: await page.getByRole('status').textContent(),
  }
  await context.unroute('**/*Faktos*.ttf')
  await retry.click()
  await page.getByRole('link', { name: 'SELECT MUSIC' }).waitFor({
    timeout: 15000,
  })
  const recovered = {
    homeLinks: await page.getByRole('link').count(),
    statusCount: await page.getByRole('status').count(),
  }
  return { failed, recovered }
}
