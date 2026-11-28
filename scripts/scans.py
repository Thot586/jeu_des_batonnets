"""
Remplace les textures de bois calculées par de vrais scans de Poly Haven (licence CC0).

- wood.webp  : placage d'érable blanc (« White Maple Veneer », Jenelle van Heerden),
               veinage tourné à la verticale et teinté vers le bois clair des allumettes ;
- board.webp : planches peintes (« White Planks Clean », Rob Tuytel), couchées à l'horizontale
               et repeintes en outremer : la scène devient une vraie table de planches.

Les papiers (kraft, Canson, aquarelle) restent fabriqués par scripts/textures.py :
Poly Haven ne propose pas de papier.

Usage :
  1. télécharger les deux scans (format JPG, 2k), par exemple avec curl :
     https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/white_maple_veneer/white_maple_veneer_diff_2k.jpg
     https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/white_planks_clean/white_planks_clean_diff_2k.jpg
  2. python3 scripts/scans.py <dossier des scans>   (numpy et Pillow requis)
À lancer après scripts/textures.py, dont il remplace deux fichiers.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "src" / "assets" / "textures"


def load(folder: Path, asset: str) -> Image.Image:
    return Image.open(folder / f"{asset}_diff_2k.jpg").convert("RGB")


def retint(rgb: np.ndarray, target: tuple[float, float, float], contrast: float) -> np.ndarray:
    """Garde le dessin du scan (ses écarts de clarté), mais le ramène à une couleur moyenne choisie."""
    luminance = rgb @ np.array([0.2126, 0.7152, 0.0722])
    relative = luminance / luminance.mean() - 1.0
    color = np.array(target, dtype=np.float64)
    return color[None, None, :] * (1.0 + contrast * relative[..., None])


def wood(folder: Path) -> None:
    scan = load(folder, "white_maple_veneer").rotate(90, expand=True).resize((768, 768), Image.LANCZOS)
    rgb = retint(np.asarray(scan, dtype=np.float64), (226, 199, 153), contrast=2.6)
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(OUT / "wood.webp", "WEBP", quality=86, method=6)


def board(folder: Path) -> None:
    scan = load(folder, "white_planks_clean").rotate(90, expand=True).resize((1536, 1536), Image.LANCZOS)
    rgb = retint(np.asarray(scan, dtype=np.float64), (43, 58, 158), contrast=1.5)
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(OUT / "board.webp", "WEBP", quality=80, method=6)


if __name__ == "__main__":
    source = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    wood(source)
    board(source)
    print("ok : wood.webp, board.webp")
