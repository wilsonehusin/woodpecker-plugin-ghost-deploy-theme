let
  pkgs = import <nixpkgs> { };
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs-18_x
    nodePackages.yarn
  ];
}
