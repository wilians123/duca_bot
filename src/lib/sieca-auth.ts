import type { Page } from "playwright";

export const loginSuccessLabels = [/Salir/i, /Tablero/i, /DUCA-T\s+Nueva/i, /Consulta/i];

export const waitForManualLogin = async (
  page: Page,
  timeout = 600_000,
) => {
  const loginUrlPattern = /\/Account\/Login/i;
  const urlChanged = page.waitForURL(
    (url) => !loginUrlPattern.test(`${url.pathname}${url.search}`),
    { timeout },
  );
  const successLabelVisible = Promise.any(
    loginSuccessLabels.map((label) =>
      page.getByText(label).first().waitFor({ state: "visible", timeout }),
    ),
  );

  await Promise.race([urlChanged, successLabelVisible]);
};
