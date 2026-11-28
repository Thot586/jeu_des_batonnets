"""
Remplace les textures calculées par de vrais scans (licence CC0).

Poly Haven :

- wood.webp  : placage d'érable blanc (« White Maple Veneer », Jenelle van Heerden),
               veinage tourné à la verticale et teinté vers le bois clair des allumettes ;
- board.webp : planches peintes (« White Planks Clean », Rob Tuytel), couchées à l'horizontale
               et repeintes en outremer : la scène devient une vraie table de planches.

ambientCG (papiers) :
- kraft.webp : papier kraft recyclé (« Paper 006 »), ramené à la couleur kraft de la palette ;
- card.webp  : papier à dessin à gros grain (« Paper 001 »), en calque transparent pour les cartes ;
- paper.webp : carton recyclé fin (« Paper 002 »), en calque pour les personnages, boutons et décor :
               c'est la fibre mouchetée du papier de couleur.
Pour les papiers, seules les petites variations sont gardées (filtre passe-haut) : sur une zone
de quelques centimètres, la teinte moyenne ne bouge pas, si bien que deux morceaux décalés
(la page et la barre collée en bas) se raccordent sans former de bloc.

Usage :
  1. télécharger les scans, par exemple avec curl :
     https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/white_maple_veneer/white_maple_veneer_diff_2k.jpg
     https://dl.polyhaven.org/file/ph-assets/Textures/jpg/2k/white_planks_clean/white_planks_clean_diff_2k.jpg
     https://ambientcg.com/get?file=Paper006_2K-JPG.zip   (à décompresser)
     https://ambientcg.com/get?file=Paper001_2K-JPG.zip   (à décompresser)
  2. python3 scripts/scans.py <dossier Poly Haven> <dossier ambientCG>   (numpy et Pillow requis)
À lancer après scripts/textures.py, dont il remplace cinq fichiers (head.webp reste calculé).
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from textures import save_overlay

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


def ambient_color(folder: Path, asset: str) -> Image.Image:
    return Image.open(folder / asset / f"{asset}_2K-JPG_Color.jpg").convert("RGB")


def wrap_blur(rgb: np.ndarray, radius: float) -> np.ndarray:
    h, w = rgb.shape[:2]
    tiled = np.tile(rgb, (3, 3, 1)) if rgb.ndim == 3 else np.tile(rgb, (3, 3))
    image = Image.fromarray(np.clip(tiled, 0, 255).astype(np.uint8))
    blurred = np.asarray(image.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float64)
    return blurred[h : 2 * h, w : 2 * w]


def kraft(folder: Path) -> None:
    scan = ambient_color(folder, "Paper006").resize((1024, 1024), Image.LANCZOS)
    rgb = np.asarray(scan, dtype=np.float64)
    relative = rgb / np.maximum(wrap_blur(rgb, 40), 1.0) - 1.0
    color = np.array([201, 165, 125], dtype=np.float64)
    out = color[None, None, :] * (1.0 + 1.5 * relative)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT / "kraft.webp", "WEBP", quality=70, method=6)


def grain_overlay(folder: Path, asset: str, size: tuple[int, int], name: str, dark: float, light: float) -> None:
    scan = ambient_color(folder, asset).resize(size, Image.LANCZOS)
    luminance = np.asarray(scan.convert("L"), dtype=np.float64)
    relative = luminance / np.maximum(wrap_blur(luminance, 24), 1.0) - 1.0
    delta = relative / (np.percentile(np.abs(relative), 99.5) + 1e-9)
    save_overlay(delta, name, dark_alpha=dark, light_alpha=light)


if __name__ == "__main__":
    polyhaven = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    ambientcg = Path(sys.argv[2] if len(sys.argv) > 2 else polyhaven)
    wood(polyhaven)
    board(polyhaven)
    kraft(ambientcg)
    # Papier à gros grain : 2048 x 1201 px, ramené à 560 x 328 pour les cartes (20 rem de large).
    grain_overlay(ambientcg, "Paper001", (560, 328), "card.webp", dark=0.3, light=0.34)
    # Papier de couleur : tuile carrée de 360 px, comme le grain calculé qu'elle remplace.
    grain_overlay(ambientcg, "Paper002", (360, 360), "paper.webp", dark=0.26, light=0.3)
    print("ok : wood.webp, board.webp, kraft.webp, card.webp, paper.webp")
