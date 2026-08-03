async (page) => {
  const patterns = [
    "**/assets/FOT-Rodin*",
    "**/assets/Faktos-*",
    "**/imgs/Logos/PersonaTunes.svg",
    "**/imgs/Chie/WorkInProgress.png",
    "**/star.svg",
  ];

  for (const pattern of patterns) {
    await page.route(pattern, (route) => route.abort("internetdisconnected"));
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("alert").waitFor();

  const offline = {
    status: await page.getByRole("status").textContent(),
    alert: await page.getByRole("alert").textContent(),
    retryButtons: await page.getByRole("button", { name: "Retry startup" }).count(),
    continueButtons: await page.getByRole("button", { name: "Continue with limited visuals" }).count(),
    homeLinks: await page.getByRole("link", { name: "SELECT MUSIC" }).count(),
  };

  await page.unrouteAll({ behavior: "wait" });
  await page.getByRole("button", { name: "Retry startup" }).click();
  await page.getByRole("link", { name: "SELECT MUSIC" }).waitFor();

  return {
    offline,
    recoveredHomeLinks: await page.getByRole("link", { name: "SELECT MUSIC" }).count(),
  };
}
