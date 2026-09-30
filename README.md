# Login Seguro — projeto para apresentação

Projeto de tela de login web com os critérios do trabalho:

- CSRF com token de uso único e campo oculto no formulário.
- Senha protegida com scrypt + salt.
- Consulta parametrizada no login real.
- Bloqueio temporário da origem após 5 falhas consecutivas.
- Recurso adicional: desafio anti-robô.
- Sessão com cookie HttpOnly + SameSite=Strict.
- Demonstração isolada de SQL Injection com duas situações: vulnerável e corrigida.

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

## Credencial da apresentação

```text
Usuário: demo
Senha: Demo@12345
```

## Como demonstrar CSRF

1. Abra a tela de login.
2. Pressione F12 e abra a guia Elements/Elementos.
3. Procure por `name="csrf_token"`.
4. O campo é um `<input type="hidden">` e recebe o token emitido pelo servidor.

Também existe um marcador `csrf_source_marker` no `index.html`, atualizado pelo frontend, para facilitar a localização durante a apresentação.

## Como demonstrar SQL Injection

Depois do login, clique em **Demonstração SQL Injection**.

Use a entrada:

```text
demo'
```

Clique primeiro em **Testar versão vulnerável**. A consulta é montada por concatenação e o apóstrofo pode provocar erro de sintaxe.

Depois clique em **Testar versão corrigida** com a mesma entrada. A consulta usa `?` como parâmetro e a entrada é tratada como dado.

A rota vulnerável existe exclusivamente para a demonstração local exigida pelo trabalho e não deve ser exposta em produção.

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
