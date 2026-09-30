# 🔐 Laboratório de Login Seguro

Projeto acadêmico desenvolvido para demonstrar um sistema de login simples, responsivo e com foco em segurança no backend.

A interface foi mantida de forma objetiva, enquanto o backend concentra as principais medidas de proteção utilizadas no processo de autenticação.

## 🛡️ Principais recursos

* Tela de login responsiva
* Token CSRF de uso único
* Proteção contra SQL Injection
* Senhas protegidas com `scrypt`
* Desafio anti-robô
* Controle de tentativas de login
* Bloqueio temporário após cinco falhas consecutivas
* Sessão protegida por cookie `HttpOnly`
* Demonstração educacional de SQL Injection
* Tela de evidências das proteções

## ⚙️ Tecnologias

* React
* TypeScript
* Node.js
* Express
* MySQL
* Drizzle ORM

## 📦 Instalação

É necessário ter o **Node.js 20 ou superior** instalado.

Clone o projeto e instale as dependências:

```bash
npm install
```

Depois, execute:

```bash
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:5173
```

## 🔑 Credenciais de demonstração

```text
Usuário: demo
Senha: Demo@12345
```

> Essas credenciais são destinadas exclusivamente ao ambiente de demonstração do trabalho.

## 🔒 Como funciona o login

O processo de autenticação acontece da seguinte forma:

1. Ao abrir a tela, o sistema solicita um desafio ao servidor.
2. O servidor gera um token CSRF e armazena apenas o hash desse token.
3. Também é criada uma pergunta matemática para o desafio anti-robô.
4. Ao enviar o formulário, o servidor valida o token CSRF e verifica se ele ainda é válido e não foi utilizado.
5. O desafio anti-robô também é validado pelo servidor.
6. Após essas verificações, o sistema consulta o usuário no banco utilizando uma consulta parametrizada pelo ORM.
7. A senha informada é comparada com o hash armazenado utilizando `scrypt` e `timingSafeEqual`.
8. Se todas as informações estiverem corretas, uma sessão é criada utilizando um cookie `HttpOnly`.
9. Caso a senha esteja incorreta, o contador de tentativas é incrementado.
10. Após cinco falhas consecutivas, a origem da tentativa fica bloqueada por dez minutos.

### 🌐 IP e endereço MAC

O navegador não disponibiliza o endereço MAC do dispositivo para um site. Por isso, nesta atividade foi utilizada a origem de rede/IP recebida pelo servidor para realizar o controle de tentativas.

## 💉 Demonstração de SQL Injection

O projeto possui uma demonstração **educacional** de SQL Injection.

Como exemplo, pode ser utilizada a entrada:

```text
demo'
```

A demonstração compara uma consulta vulnerável, construída por concatenação, com uma consulta protegida que utiliza parâmetros.

A versão vulnerável é apresentada apenas para fins didáticos. **Ela não é executada pelo servidor e não existe uma rota de login vulnerável disponível no projeto.**

A implementação real utiliza consulta parametrizada, tratando a entrada do usuário como dado.

## 🔄 Reiniciando o banco

Para zerar os experimentos e remover o banco local durante os testes, pare o servidor e execute no PowerShell:

```powershell
Remove-Item .\login-seguro.db -ErrorAction SilentlyContinue
```

Depois, execute novamente:

```bash
npm run dev
```

## 🧪 Testes

Para executar os testes automatizados:

```bash
npm test
```

Para verificar os tipos do projeto:

```bash
npm run typecheck
```

## 📚 Referências

As principais referências utilizadas no desenvolvimento foram as recomendações da **OWASP** relacionadas a:

* Cross-Site Request Forgery (CSRF)
* SQL Injection
* Autenticação e gerenciamento de senhas

## 📌 Observação

As telas de evidências e a área autenticada permanecem disponíveis no código para consulta e demonstração, mas a versão apresentada utiliza uma interface de login simplificada, mantendo as principais proteções de segurança.
