{pkgs}:
pkgs.mkShell {
  packages = [
    pkgs.bun
    pkgs.nodejs-slim
    pkgs.pnpm
  ];
}
