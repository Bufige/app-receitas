{
  description = "Node.js development environment (automatic version from .nvmrc or .node-version)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Look for .node-version first, then .nvmrc
        nodeVersionFile =
          if builtins.pathExists ./.node-version then ./.node-version
          else if builtins.pathExists ./.nvmrc then ./.nvmrc
          else null;

        # Read the file, remove leading "v" if present, and trailing newline
        rawVersion =
          if nodeVersionFile != null
          then
            let
              content = lib.strings.removeSuffix "\n" (builtins.readFile nodeVersionFile);
            in
              lib.strings.removePrefix "v" content
          else "22";

        # Extract major version
        majorVersion = builtins.head (builtins.splitVersion rawVersion);

        # Select the correct Node.js package
        nodejs =
          if majorVersion == "24" then pkgs.nodejs_24
          else if majorVersion == "22" then pkgs.nodejs_22
          else if majorVersion == "20" then pkgs.nodejs_20
          else if majorVersion == "18" then pkgs.nodejs_18
          else pkgs."nodejs_${majorVersion}_x"
            or pkgs."nodejs-${majorVersion}_x"
            or pkgs."nodejs_${majorVersion}"
            or pkgs."nodejs-${majorVersion}"
            or pkgs.nodejs;  # final fallback

        lib = pkgs.lib;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [ nodejs pkgs.prisma-engines ];

          shellHook = ''
            echo "🚀 Loaded Node.js $(node -v) (from ${if nodeVersionFile != null then builtins.baseNameOf nodeVersionFile else "default"}) for $(basename $PWD)"
          '';
        };
      });
}
