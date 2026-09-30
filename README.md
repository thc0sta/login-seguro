# Laboratório de Login Seguro

O projeto foi feito com uma tela de login simples e responsiva. A ideia foi manter a interface fácil de entender e concentrar as principais medidas de segurança no backend.

O formulário possui usuário, senha, um campo oculto para o token CSRF e um pequeno desafio anti-robô. Quando o usuário tenta fazer login, o servidor verifica essas informações antes de consultar a conta.

Além disso, a senha não é armazenada diretamente no banco. Ela é protegida usando scrypt, com um salt individual para cada senha. Quando o login é realizado corretamente, o sistema cria uma sessão protegida por cookie HTTP-only.

As telas de evidências e da área autenticada continuam no código para consulta, mas não fazem parte da versão simplificada da interface apresentada.

## Requisitos

- Tela de login responsiva
- Token CSRF
- Proteção contra SQL Injection
- Proteção das senhas
- Anti-robô
- Bloqueio de tentativas
- Demonstração de SQL Injection
- Evidências

  As principais referências utilizadas foram as recomendações da OWASP para proteção contra CSRF, SQL Injection e autenticação.

  ## Instalação

Use Node.js 20+.

```powershell
npm install
npm run dev
```

Acesse:

```text
http://localhost:5173
```

## Credenciais para demonstração

```text
Usuário: demo
Senha: Demo@12345
```
Essas credenciais são apenas para o ambiente de demonstração do trabalho.

## Como funciona o login

O processo de login acontece da seguinte forma:

Ao abrir a tela, o sistema solicita um desafio ao servidor.
O servidor gera um token CSRF e guarda apenas o hash desse token.
Também é criada uma pergunta matemática para o desafio anti-robô.
Ao enviar o formulário, o servidor verifica o token CSRF e confirma se ele ainda é válido e não foi usado anteriormente.
O desafio anti-robô também é conferido.
Depois dessas verificações, o sistema procura o usuário no banco utilizando o ORM:
eq(loginAccounts.username, username).
A senha informada é comparada com o hash armazenado utilizando scrypt e timingSafeEqual.
Se estiver tudo correto, uma sessão é criada em um cookie HTTP-only.
Se a senha estiver errada, o contador de tentativas aumenta.
Depois de cinco falhas, o acesso daquela origem fica bloqueado por dez minutos.

```Observação sobre IP/MAC: o navegador não disponibiliza o endereço MAC para um site. Por isso, para esta atividade foi utilizada a origem de rede/IP recebida pelo servidor, que corresponde à alternativa prevista no enunciado.```

## Demonstração de SQL Injection

Depois do login, clique em **Demonstração SQL Injection**.

Use a entrada:

```text
demo'
```

Clique primeiro em **Testar versão vulnerável**. A consulta é montada por concatenação e o apóstrofo pode provocar erro de sintaxe.

Depois clique em **Testar versão corrigida** com a mesma entrada. A consulta usa `?` como parâmetro e a entrada é tratada como dado.

Para evitar criar uma vulnerabilidade real no projeto, o exemplo de SQL Injection foi colocado apenas como texto na tela de evidências. Ele não é executado pelo servidor e não recebe os dados digitados no formulário.


## Reset do bloqueio

Para zerar as tentativas durante os testes, pare o servidor e remova:

```powershell
Remove-Item .\login-seguro.db -ErrorAction SilentlyContinue
```

Depois execute `npm run dev` novamente.

## Testes

```powershell
npm test
npm run typecheck
```
