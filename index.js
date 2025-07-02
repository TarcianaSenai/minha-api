import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Aqui Carrega variáveis do .env (como MONGO_URI)
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json()); // Permite receber JSON no corpo das requisições

// AQui Conecta com o banco MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado ao MongoDB");
  } catch (error) {
    console.log("Erro ao conectar com o MongoDB", error);
  }
};
connectDB();

// AQui Inicia o servidor
app.listen(PORT, () => console.log(`O servidor está rodando na porta ${PORT}`));

// Modelo de Filme
const Filme = mongoose.model("Filme", {
  titulo: String,
  descricao: String,
  diretor: String,
  anoLancamento: Number,
});

// Modelo de Usuário
const Usuario = mongoose.model("Usuario", {
  nome: String,
  email: String,
  senha: Number,
});

// Rota para cadastrar novo usuário
app.post("/post/cadastro", async (req, res) => {
  const novoUsuario = new Usuario({
    nome: req.body.nome,
    email: req.body.email,
    senha: req.body.senha,
  });

  try {
    await novoUsuario.save();
    res.status(201).send("Usuário cadastrado com sucesso!");
  } catch (err) {
    res.status(500).send("Erro ao cadastrar usuário.");
  }
});

// Middleware de autenticação (Basic Auth)
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Verifica se existe o cabeçalho de autorização e se é do tipo "Basic"
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).send("Credenciais não fornecidas.");
  }

  // Separa e decodifica o conteúdo
  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );

  // Divide em email e senha
  const [email, senha] = credentials.split(":");

  try {
    // Verifica se existe um usuário com essas credenciais
    const usuario = await Usuario.findOne({ email, senha });

    if (!usuario) {
      return res.status(401).send("Credenciais inválidas.");
    }

    req.usuario = usuario; // Salva o usuário autenticado na requisição
    next(); // Permite continuar para a próxima etapa (rota)
  } catch (error) {
    res.status(500).send("Erro na autenticação.");
  }
};

// Rota para listar todos os filmes (protegida)
app.get("/get", authMiddleware, async (req, res) => {
  const filmes = await Filme.find();
  return res.send(filmes);
});

// Rota para adicionar novo filme (protegida)
app.post("/post", authMiddleware, async (req, res) => {
  const filme = new Filme({
    titulo: req.body.titulo,
    descricao: req.body.descricao,
    diretor: req.body.diretor,
    anoLancamento: req.body.anoLancamento,
  });

  await filme.save();
  return res.send(filme);
});

// Rota para deletar um filme pelo ID (protegida)
app.delete("/:id", authMiddleware, async (req, res) => {
  const filme = await Filme.findByIdAndRemove(req.params.id);
  return res.send(filme);
});

// Rota para atualizar um filme pelo ID (protegida)
app.put("/:id", authMiddleware, async (req, res) => {
  const filme = await Filme.findByIdAndUpdate(
    req.params.id,
    {
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      diretor: req.body.diretor,
      anoLancamento: req.body.anoLancamento,
    },
    { new: true } // Retorna o filme já atualizado
  );
  return res.send(filme);
});

// Rota apenas para ver todos os usuários cadastrados (apenas teste, pode remover depois)
app.get("/get/login", async (req, res) => {
  const usuarios = await Usuario.find();
  return res.send(usuarios);
});
