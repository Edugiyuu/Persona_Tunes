async (page) => {
  await page.route('**/assets/Home-*.js', (route) =>
    route.fulfill({ status: 503, body: 'temporarily unavailable' }),
  )

  await page.reload({ waitUntil: 'domcontentloaded' })
  const reload = page.getByRole('button', { name: 'Reload application' })
  await reload.waitFor()

  const failed = {
    alert: await page.getByRole('alert').textContent(),
    homeLinks: await page.getByRole('link', { name: 'SELECT MUSIC' }).count(),
    reloadButtons: await reload.count(),
  }

  await page.unrouteAll({ behavior: 'wait' })
  await reload.click()
  await page.getByRole('link', { name: 'SELECT MUSIC' }).waitFor()

  return {
    failed,
    recoveredHomeLinks: await page.getByRole('link', { name: 'SELECT MUSIC' }).count(),
  }
}
