"""O endereço por onde a foto de uma unidade chega do navegador.

WebSocket transporta JSON, e uma foto de celular em JSON seria um terço maior
e carregada duas vezes na memória. Por isso o envio tem endereço próprio, que
recebe o arquivo como o navegador já sabe mandar — um formulário comum.

Autenticado como qualquer outra rota da API do Home Assistant: quem não está
logado não chega aqui. O que se grava, porém, vai parar em ``/local/``, que é
servido **sem** autenticação — então o conteúdo é conferido antes, e o nome do
arquivo nunca vem de quem envia.
"""

from __future__ import annotations

import logging
from typing import Any

from .unit_images import UnitImageError, save_image

_LOGGER = logging.getLogger(__name__)

UPLOAD_URL = "/api/co_energy/unit_image"
INVOICE_UPLOAD_URL = "/api/co_energy/invoice"


def async_register_http_api(hass: Any) -> None:
    """Register the picture upload endpoint.

    O import do Home Assistant acontece aqui dentro, e nao no topo, para este
    modulo continuar importavel fora dele — que e como os testes exercitam o
    resto do backend.
    """
    from homeassistant.components.http import HomeAssistantView

    class UnitImageUploadView(HomeAssistantView):
        """Receive one picture for one unit."""

        url = UPLOAD_URL
        name = "api:co_energy:unit_image"

        async def post(self, request: Any) -> Any:
            hass_local = request.app["hass"]
            try:
                formulario = await request.post()
            except Exception:
                return self.json_message("malformed upload", 400)

            unit_id = formulario.get("unit_id")
            enviado = formulario.get("file")
            if not isinstance(unit_id, str) or not unit_id.strip():
                return self.json_message("unit_id is required", 400)
            if enviado is None or not hasattr(enviado, "file"):
                return self.json_message("file is required", 400)

            dados = enviado.file.read()
            try:
                # Gravar em disco bloqueia; o loop de eventos nao pode esperar.
                resultado = await hass_local.async_add_executor_job(
                    save_image, hass_local, unit_id, enviado.filename, dados
                )
            except UnitImageError as error:
                # Recusa esperada — formato errado, arquivo grande demais —, e
                # a mensagem e para ser lida por quem enviou.
                return self.json_message(str(error), 400)
            except Exception:
                _LOGGER.error("Could not store the unit picture", exc_info=True)
                return self.json_message("could not store the picture", 500)

            return self.json(resultado)

    class InvoiceUploadView(HomeAssistantView):
        """Receive one invoice PDF, read it, and forget the file.

        Diferente da foto, nada daqui vai para ``/local/``: o PDF carrega
        nome, CPF e endereco. Ele e lido numa pasta temporaria e apagado; o
        que fica sao os dados que o extrator ja filtra, no storage.
        """

        url = INVOICE_UPLOAD_URL
        name = "api:co_energy:invoice"

        async def post(self, request: Any) -> Any:
            from homeassistant.util import dt as dt_util

            from .const import DOMAIN
            from .invoice_storage import InvoiceStorageError, async_import_invoice
            from .runtime import CoEnergyRuntime

            hass_local = request.app["hass"]
            runtime = hass_local.data.get(DOMAIN)
            if not isinstance(runtime, CoEnergyRuntime) or runtime.invoice_manager is None:
                return self.json_message("invoice storage is unavailable", 503)
            try:
                formulario = await request.post()
            except Exception:
                return self.json_message("malformed upload", 400)
            enviado = formulario.get("file")
            if enviado is None or not hasattr(enviado, "file"):
                return self.json_message("file is required", 400)

            dados = await hass_local.async_add_executor_job(enviado.file.read)
            try:
                resultado = await async_import_invoice(
                    hass_local,
                    runtime.invoice_manager,
                    runtime.model,
                    enviado.filename,
                    dados,
                    dt_util.now(),
                )
            except InvoiceStorageError as error:
                # Recusa esperada — nao e PDF, nao e fatura, mes ilegivel —, e
                # a mensagem e para ser lida por quem enviou.
                return self.json_message(str(error), 400)
            except Exception:
                _LOGGER.error("Could not import the invoice", exc_info=True)
                return self.json_message("could not import the invoice", 500)
            return self.json(resultado)

    hass.http.register_view(UnitImageUploadView)
    hass.http.register_view(InvoiceUploadView)
