{pkgs}:
pkgs.mkShell {
  packages = [
    pkgs.bun
  ];
}
