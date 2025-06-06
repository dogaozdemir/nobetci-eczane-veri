import handler from "../pages/api/update-eczaneler";

(async () => {
  await handler({}, { status: () => ({ json: console.log }) });
})();
