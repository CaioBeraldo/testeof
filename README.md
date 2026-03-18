# QuadroAI Pro — Flask Edition

Gerador de prompts premium para quadros decorativos (Flow AI / Minimax).
Roda localmente no seu PC Windows em 3 comandos.

---

## Instalacao (Windows)

### 1. Abra o terminal (Prompt de Comando ou PowerShell)

Pressione `Win + R`, digite `cmd` e pressione Enter.

### 2. Navegue ate a pasta do projeto

```
cd C:\caminho\para\quadroai-pro
```

Exemplo:
```
cd C:\Users\SeuNome\Desktop\quadroai-pro
```

### 3. Crie um ambiente virtual Python

```
python -m venv venv
```

### 4. Ative o ambiente virtual

```
venv\Scripts\activate
```

Voce vai ver `(venv)` aparecer no inicio da linha. Isso e correto.

### 5. Instale as dependencias

```
pip install -r requirements.txt
```

### 6. Rode o servidor

```
python app.py
```

Voce vai ver:
```
======================================================
  QuadroAI Pro — rodando em http://localhost:5000
======================================================
```

### 7. Abra no navegador

Acesse: **http://localhost:5000**

---

## Configuracao da API Key

Voce tem duas opcoes:

**Opcao A (mais segura) — arquivo .env:**
1. Copie o arquivo `.env.example` e renomeie para `.env`
2. Abra com Bloco de Notas e coloque sua chave:
   ```
   ANTHROPIC_API_KEY=sk-ant-SuaChaveAqui
   ```
3. Salve. Agora a chave e lida automaticamente sem precisar digitar no site.

**Opcao B (mais simples) — digitar no site:**
- Abra o site, cole sua chave no campo "Chave API Anthropic" e pronto.
- A chave fica salva no navegador automaticamente.

---

## Como rodar toda vez que quiser usar

Voce so precisa fazer a instalacao uma vez. Depois disso:

```
cd C:\caminho\para\quadroai-pro
venv\Scripts\activate
python app.py
```

E acessar http://localhost:5000

---

## Estrutura do projeto

```
quadroai-pro/
├── app.py              ← Servidor Flask (backend Python)
├── requirements.txt    ← Dependencias
├── .env.example        ← Modelo do arquivo de configuracao
├── .env                ← Sua chave API (voce cria, nao esta no projeto)
├── templates/
│   └── index.html      ← Pagina principal
└── static/
    ├── style.css       ← Estilo visual
    ├── config.js       ← Categorias e opcoes de prompt
    └── app.js          ← Logica da interface
```

---

## Diferenca do HTML standalone

| Feature           | HTML standalone     | Flask (este projeto)      |
|-------------------|---------------------|---------------------------|
| Execucao          | Abre no Chrome      | `python app.py`           |
| API key           | Salva no navegador  | `.env` no servidor        |
| Seguranca         | Key no browser      | Key nunca chega ao browser|
| Deploy em servidor| Nao                 | Sim (VPS, Railway, etc.)  |
| Multi-usuario     | Nao                 | Possivel de expandir      |

---

## Deploy em servidor (quando quiser colocar online)

Recomendado para comecar: **Railway** (https://railway.app)

1. Faca upload do projeto no GitHub
2. Conecte no Railway
3. Configure a variavel de ambiente `ANTHROPIC_API_KEY`
4. Deploy automatico

Custo estimado: ~$5/mes para uso pessoal.

---

Duvidas? Abra o projeto numa sessao com o assistente e pergunte.
