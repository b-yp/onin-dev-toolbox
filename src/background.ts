import { command, lifecycle, settings } from "onin-sdk";

lifecycle.onLoad(async () => {
  await settings.useSettingsSchema([
    {
      key: "accentColor",
      label: "Accent Color",
      type: "color",
      defaultValue: "#111827",
      description: "Example plugin setting registered during background onLoad.",
    },
  ]);
  await command.handle(async (code) => {
    if (code === "open") {
      return {
        ok: true,
      };
    }

    return null;
  });
});
