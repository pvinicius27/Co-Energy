"""Vocabulário dos itens faturados que o backend reconhece.

Estes códigos **não** são o texto impresso na fatura. Quem traduz a rubrica
impressa para cá é o extrator: ele carrega uma tabela que casa o texto do PDF
com um código estável, e é esse código que chega no JSON publicado.

    "PARC INJET ..."                      ->  parc_injet_s_desc
    "BONUS ITAIPU ART.21 LEI 10438/02(-)" ->  bonus_itaipu

É por isso que o backend não conhece nenhuma distribuidora: ele conhece este
vocabulário. Um extrator de outra concessionária publica os mesmos códigos
para as rubricas equivalentes, e nada aqui precisa mudar.

Este módulo existe para que o vocabulário tenha um lugar só. Antes dele, os
mesmos códigos eram declarados em `payback_projection` e em `scee_savings`,
com nomes de constante diferentes para o mesmo valor — duas listas que podiam
divergir em silêncio, cada uma sustentando um cálculo de dinheiro.

Ausência de um código não é erro: nem toda fatura traz todas as rubricas. Uma
fatura que compensa 100% do consumo, por exemplo, não imprime
`consumo_nao_compensado`, e quem consome aqui trata essa falta explicitamente.
"""

from __future__ import annotations

# --------------------------------------------------------------- energia

#: Consumo que o crédito não cobriu. É o único item que publica a tarifa de
#: energia cheia da unidade, por isso serve de fonte para a tarifa do período.
NON_COMPENSATED_CONSUMPTION = "consumo_nao_compensado"

#: Consumo total faturado, quando a fatura não separa a parcela compensada.
TOTAL_CONSUMPTION = "consumo_kwh"

#: Consumo que participa do SCEE.
SCEE_CONSUMPTION = "consumo_scee"

#: Energia injetada na rede, lançada como quantidade.
SCEE_INJECTION = "injecao_scee"

#: Cobrança da energia compensada — o que a distribuidora cobra pelo uso da
#: rede sobre a energia que o crédito abateu. Não é desconto: é encargo.
COMPENSATED_ENERGY_CHARGE = "parc_injet_s_desc"

#: Benefício tarifário do SCEE, antes e depois dos descontos da fatura.
GROSS_TARIFF_BENEFIT = "beneficio_tarifario_bruto_scee"
NET_TARIFF_BENEFIT = "beneficio_tarifario_liquido_scee"

#: Itens de energia e o par contábil do SCEE: são os que mudam quando existe
#: compensação, e por isso não fazem parte dos encargos que a fatura cobraria
#: de qualquer jeito.
ENERGY_CODES = frozenset({
    SCEE_CONSUMPTION,
    SCEE_INJECTION,
    COMPENSATED_ENERGY_CHARGE,
    NON_COMPENSATED_CONSUMPTION,
    TOTAL_CONSUMPTION,
    GROSS_TARIFF_BENEFIT,
    NET_TARIFF_BENEFIT,
})

#: Onde procurar a tarifa de energia cheia, em ordem de preferência.
FULL_TARIFF_CODES = (NON_COMPENSATED_CONSUMPTION, TOTAL_CONSUMPTION)

# --------------------------------------------------------------- encargos

#: Contribuição de iluminação pública (CIP/COSIP). Não depende do consumo e o
#: sistema solar não a reduz — por isso nunca entra como economia.
PUBLIC_LIGHTING = "contrib_ilum_publica_municipal"

JUROS = "juros_moratoria"
MULTA = "multa"

#: Encargos que já têm coluna própria na auditoria.
LABELLED_CHARGE_CODES = frozenset({PUBLIC_LIGHTING, JUROS, MULTA})

# ------------------------------------------------------------- categorias

#: Categoria, não código: a bandeira tarifária chega com códigos variáveis
#: (amarela, vermelha patamar 1 e 2), e o que os une é a categoria.
FLAG_CATEGORY = "bandeira_tarifaria"
