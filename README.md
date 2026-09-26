# Gestão de Energia

Integração para Home Assistant que acompanha energia em instalações com
geração solar e mais de uma unidade consumidora: o que foi medido, o que a
distribuidora faturou, e a diferença entre os dois — cada valor carregando a
sua origem.

## O que ela faz

- **Lê a fatura em PDF** pelo navegador e guarda só os dados. O PDF não fica no
  Home Assistant.
- **Audita a distribuidora**: compara o que a fatura registrou com o que os
  seus medidores mediram, no mesmo intervalo.
- **Acompanha o rateio** entre as unidades beneficiárias, preservando o
  histórico de quando a regra mudou.
- **Calcula o retorno do investimento** solar, somando autoconsumo e crédito
  rateado, e marca o ciclo em que o sistema se pagou.
- **Separa o que é medido do que é estimado.** Todo valor carrega a origem:
  oficial, medido, calculado, projetado ou estimado. Dado ausente aparece como
  ausente, nunca como zero.

## Requisitos

- Home Assistant 2026.9 ou mais recente, com o Recorder ativo.
- Medição no Home Assistant para as unidades que você quer auditar. Unidade sem
  medidor continua funcionando pela fatura, e é apresentada como tal.
- As faturas em PDF da distribuidora, no seu computador — o PDF digital da 2ª
  via, não foto ou escaneado. Distribuidoras lidas hoje:
  - **Equatorial Goiás**, inclusive com geração solar (SCEE);
  - **CPFL Piratininga**, por enquanto só sem geração solar.

  As outras distribuidoras dos dois grupos usam o mesmo modelo de fatura e
  devem funcionar, mas ainda não foram conferidas com uma fatura real.

## Instalação

### Pelo HACS

1. HACS → menu → **Repositórios personalizados**
2. Cole a URL deste repositório, tipo **Integration**
3. Instale e reinicie o Home Assistant

### Manual

1. Copie a pasta `custom_components/co_energy` para o `custom_components` da sua
   instalação
2. Reinicie o Home Assistant

## Primeiros passos

**Configurações → Dispositivos e serviços → Adicionar integração → Gestão de
Energia.** Um assistente pede a primeira unidade — nome, se ela gera energia e
se tem medidor no Home Assistant — e, se tiver medidor, os sensores dela. Dá
para cadastrar outras unidades ali mesmo antes de concluir.

Pronto — **Gestão de Energia** aparece na barra lateral. Para mudar qualquer
coisa depois, use **Configurar** na página da integração: unidades, sensores
(inclusive troca de medidor), rateio, tarifa, investimento e horário de corte.
As faturas em PDF são lidas pela própria tela, na aba Configuração. Nada disso
exige editar YAML.

A tela também está disponível como cartão (`co-energy-overview-card-v6`) para
quem prefere montá-la num painel próprio.

## O que ela não faz

- Não cria entidades novas nem duplica histórico. Ela lê o que já existe.
- Não escreve na sua instalação elétrica nem comanda nada.
- Não envia dado nenhum para fora. Tudo roda no seu Home Assistant.
- Não substitui a fatura: os números dela são para conferir e entender, não
  para contestar sozinho.

## Seus dados

Faturas, leituras e valores ficam no seu Home Assistant e em nenhum outro
lugar. Remover a integração apaga o que ela guardou, inclusive as faturas e as
fotos das unidades — o caminho de volta é o backup do Home Assistant, e a tela
oferece exportar as faturas em JSON antes.

## Licença

Software proprietário. O uso depende de licença concedida pelo autor e vale
para uma instalação. Redistribuir, revender ou publicar o código não é
permitido. Veja [`LICENSE`](LICENSE).
