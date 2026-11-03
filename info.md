# Gestão de Energia

Acompanhamento de energia para quem tem geração solar e mais de uma unidade
consumidora: o que foi medido, o que a distribuidora faturou, e a diferença
entre os dois.

## O que ela faz

- **Lê a fatura em PDF** direto pelo navegador e guarda só os dados. O PDF não
  fica no Home Assistant.
- **Audita a distribuidora**: compara o que a fatura registrou com o que os
  seus medidores mediram, no mesmo intervalo.
- **Acompanha o rateio** entre as unidades beneficiárias, preservando o
  histórico de quando a regra mudou.
- **Calcula o retorno do investimento** solar, somando autoconsumo e crédito
  rateado, e marca o ciclo em que o sistema se pagou.
- **Separa o que é medido do que é estimado.** Todo valor carrega a origem:
  oficial, medido, calculado, projetado ou estimado. Dado ausente aparece como
  ausente, nunca como zero.

## O que você precisa

- Home Assistant 2026.9 ou mais recente, com o Recorder ativo.
- Medição no Home Assistant para as unidades que você quer auditar. Unidade sem
  medidor continua funcionando pela fatura, e é apresentada como tal.
- As faturas em PDF da distribuidora, no seu computador.

## O que ela não faz

- Não cria entidades novas nem duplica histórico. Ela lê o que já existe.
- Não escreve na sua instalação elétrica nem comanda nada.
- Não envia dado nenhum para fora. Tudo roda no seu Home Assistant.
- Não substitui a fatura: os números dela são para conferir e entender, não
  para contestar sozinho.

## Depois de instalar

Adicione a integração pela tela de dispositivos e serviços. A instalação começa
vazia — as unidades, os medidores e o rateio são configurados pela própria
dashboard, sem editar YAML.

## Licença

Software proprietário. O uso depende de licença concedida pelo autor e vale
para uma instalação. Redistribuir, revender ou publicar o código não é
permitido. Veja o arquivo `LICENSE`.
