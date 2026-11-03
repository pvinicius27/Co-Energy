"""As fotos das unidades: guardar as que chegam e listar as que existem.

O Home Assistant publica o conteúdo de ``config/www/`` em ``/local/``, então
uma foto gravada ali já está acessível ao navegador. Só que saber disso é
conhecimento de quem construiu o sistema, não de quem o instala: pedir que
alguém copie arquivos para uma pasta específica antes de usar o produto é o
mesmo obstáculo que o resto deste trabalho existe para remover.

Por isso a foto chega pela tela. Este módulo recebe os bytes, confere que são
mesmo uma imagem, escolhe um nome que o operador não controla e grava — e
**cria a pasta se ela não existir**, porque numa instalação nova ela nunca
existe.

O nome nunca vem de quem envia. Um arquivo chamado ``../../configuration.yaml``
sairia da pasta e sobrescreveria o que não devia; aqui ele vira
``<unidade>.png`` e pronto.
"""

from __future__ import annotations

from pathlib import Path
import re
from typing import Any

#: Onde o projeto guarda as fotos, relativo ao diretório de configuração.
IMAGES_RELATIVE_PATH = ("www", "energy_dashboard", "imagens")

#: O prefixo público equivalente: ``config/www/x`` é servido em ``/local/x``.
PUBLIC_PREFIX = "/local/energy_dashboard/imagens"

#: Formatos que um navegador exibe sem plugin. Um arquivo que nao seja imagem
#: na pasta — um .txt de anotacoes, um .zip esquecido — e ignorado em vez de
#: virar uma opcao que quebraria a tela ao ser escolhida.
IMAGE_SUFFIXES = frozenset({".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"})

#: Uma foto de celular passa dos 5 MB com facilidade; acima disto e engano.
MAX_IMAGE_BYTES = 12 * 1024 * 1024

#: Os formatos aceitos no envio, cada um com a assinatura que prova que o
#: arquivo e o que o nome diz. SVG fica de fora de proposito: e texto, aceita
#: script dentro, e nao ha como conferir por assinatura o que ele carrega.
_SIGNATURES: tuple[tuple[str, bytes, int], ...] = (
    (".png", b"\x89PNG\r\n\x1a\n", 0),
    (".jpg", b"\xff\xd8\xff", 0),
    (".gif", b"GIF87a", 0),
    (".gif", b"GIF89a", 0),
    (".webp", b"WEBP", 8),
)


class UnitImageError(ValueError):
    """Raised when an uploaded picture cannot be accepted."""


def _detected_suffix(data: bytes) -> str | None:
    """Return the format the bytes actually are, or None."""
    for suffix, assinatura, inicio in _SIGNATURES:
        if data[inicio:inicio + len(assinatura)] == assinatura:
            return suffix
    return None


def safe_image_name(unit_id: str, file_name: Any, data: bytes) -> str:
    """Return the name this picture will be stored under.

    Derivado da unidade, nunca do arquivo enviado: e o que impede um nome como
    `../../configuration.yaml` de sair da pasta. A extensao vem do conteudo, e
    nao do nome, porque um `.png` que e outra coisa nao abriria na tela.
    """
    if not isinstance(unit_id, str) or not unit_id.strip():
        raise UnitImageError("unit_id must be a non-empty string")
    if not isinstance(data, (bytes, bytearray)) or not data:
        raise UnitImageError("the picture is empty")
    if len(data) > MAX_IMAGE_BYTES:
        raise UnitImageError("the picture is too large")

    detectado = _detected_suffix(bytes(data[:16]))
    if detectado is None:
        raise UnitImageError("the file is not a supported picture")

    # O nome enviado so decide entre .jpg e .jpeg, que sao o mesmo formato.
    if detectado == ".jpg" and isinstance(file_name, str):
        if Path(file_name).suffix.lower() == ".jpeg":
            detectado = ".jpeg"

    seguro = "".join(
        caractere if caractere.isalnum() or caractere == "_" else "_"
        for caractere in unit_id.strip().lower()
    )
    # Um id vindo do construtor ja chega limpo; isto e a rede para o que vier
    # de outro lugar, e uma sequencia de separadores nao precisa virar uma
    # fileira de sublinhados no nome do arquivo.
    seguro = re.sub(r"_+", "_", seguro).strip("_")
    if not seguro:
        raise UnitImageError(f"unit_id {unit_id!r} has no usable characters")
    return f"{seguro}{detectado}"


def save_image_in(
    directory: Any, unit_id: str, file_name: Any, data: bytes
) -> dict[str, Any]:
    """Store one picture for a unit and return how to reference it.

    Cria a pasta quando ela nao existe — numa instalacao nova ela nunca
    existe. Substitui a foto anterior da mesma unidade, inclusive quando o
    formato muda: deixar a antiga para tras encheria a pasta de arquivos que
    ninguem mais referencia.
    """
    nome = safe_image_name(unit_id, file_name, data)
    caminho = Path(directory)
    try:
        caminho.mkdir(parents=True, exist_ok=True)
    except OSError as error:
        raise UnitImageError(f"could not create the pictures folder: {error}") from error

    for anterior in caminho.glob(f"{Path(nome).stem}.*"):
        if anterior.name != nome and anterior.suffix.lower() in IMAGE_SUFFIXES:
            try:
                anterior.unlink()
            except OSError:
                # Nao impede a gravacao: sobrar um arquivo antigo e menos
                # grave do que recusar a foto nova por causa dele.
                pass

    try:
        (caminho / nome).write_bytes(bytes(data))
    except OSError as error:
        raise UnitImageError(f"could not store the picture: {error}") from error

    return {"file_name": nome, "url": image_url(nome), "size_bytes": len(data)}


def image_url(file_name: str) -> str:
    """Return the public URL for one file inside the pictures folder."""
    return f"{PUBLIC_PREFIX}/{file_name}"


def list_images_in(directory: Any) -> tuple[dict[str, Any], ...]:
    """Return the pictures found in one directory, ordered by name.

    Pasta ausente devolve lista vazia, e nao erro: quem nunca guardou uma foto
    esta num estado legitimo, e a tela sabe dizer onde coloca-las. O mesmo vale
    para uma pasta que nao pode ser lida — a configuracao inteira nao pode cair
    porque um enfeite nao esta acessivel.
    """
    caminho = Path(directory)
    try:
        if not caminho.is_dir():
            return ()
        arquivos = sorted(
            item
            for item in caminho.iterdir()
            if item.is_file() and item.suffix.lower() in IMAGE_SUFFIXES
        )
    except OSError:
        return ()

    encontradas: list[dict[str, Any]] = []
    for arquivo in arquivos:
        try:
            tamanho = arquivo.stat().st_size
        except OSError:
            tamanho = None
        encontradas.append({
            "file_name": arquivo.name,
            "url": image_url(arquivo.name),
            "size_bytes": tamanho,
        })
    return tuple(encontradas)


def images_directory(hass: Any) -> Path:
    """Return the pictures folder of this Home Assistant installation."""
    return Path(hass.config.path(*IMAGES_RELATIVE_PATH))


def list_available_images(hass: Any) -> tuple[dict[str, Any], ...]:
    """Return the pictures available to be chosen for a unit."""
    return list_images_in(images_directory(hass))


def save_image(
    hass: Any, unit_id: str, file_name: Any, data: bytes
) -> dict[str, Any]:
    """Store one uploaded picture for a unit in this installation."""
    return save_image_in(images_directory(hass), unit_id, file_name, data)
