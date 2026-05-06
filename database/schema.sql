CREATE DATABASE IF NOT EXISTS greenlife CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE greenlife;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') DEFAULT 'user',
  status ENUM('ativo','suspenso','banido') DEFAULT 'ativo',
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  color VARCHAR(20) DEFAULT '#40916C',
  icon VARCHAR(10) DEFAULT '🌱'
);

CREATE TABLE IF NOT EXISTS tips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category_id INT,
  author_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tip_likes (
  user_id INT NOT NULL,
  tip_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tip_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tip_id) REFERENCES tips(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tip_saves (
  user_id INT NOT NULL,
  tip_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tip_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tip_id) REFERENCES tips(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tip_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tip_id) REFERENCES tips(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS eco_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '🌱',
  co2_saved DECIMAL(6,2) DEFAULT 0,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(200),
  icon VARCHAR(10) DEFAULT '🏅',
  requirement_type VARCHAR(50),
  requirement_value INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

-- ── SEED DATA ──────────────────────────────────────────────────────────────
INSERT IGNORE INTO categories (name, color, icon) VALUES
  ('Reciclagem','#40916C','♻️'),
  ('Água','#5BA4CF','💧'),
  ('Energia','#E9A824','⚡'),
  ('Consumo Consciente','#8E44AD','🛒');

INSERT IGNORE INTO users (name, email, password_hash, role, points) VALUES
  ('Admin GreenLife','admin@greenlife.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin',9999),
  ('Ana Souza','ana@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','user',1240),
  ('Carlos Lima','carlos@email.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','user',890);

INSERT IGNORE INTO tips (title, description, category_id, author_id) VALUES
  ('Separe o lixo corretamente','A separação adequada do lixo reduz até 30% dos resíduos em aterros sanitários e facilita a reciclagem.',1,1),
  ('Feche a torneira ao escovar os dentes','Esse simples hábito economiza até 12 litros de água por minuto de torneira aberta.',2,1),
  ('Use lâmpadas LED','LEDs consomem 75% menos energia e duram 25 vezes mais do que as lâmpadas incandescentes.',3,1),
  ('Prefira produtos a granel','Embalagens a granel reduzem até 70% do plástico descartado no processo de compra.',4,1),
  ('Opte por transporte sustentável','Bicicleta e transporte público reduzem drasticamente as emissões de CO₂ por pessoa.',3,2),
  ('Cultive uma hortinha em casa','Produzir seus próprios alimentos reduz emissões geradas pelo transporte da comida até você.',4,2);

INSERT IGNORE INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('Primeiro Passo','Registre sua primeira ação ecológica','🌱','actions',1),
  ('Reciclador','Registre 10 ações de reciclagem','♻️','recycle_actions',10),
  ('Transporte Verde','Use transporte público 5 vezes','🚌','transport_actions',5),
  ('Guardião da Água','Economize 100 litros de água','💧','water_actions',5),
  ('Poupador de Energia','Registre 20 ações de energia','⚡','energy_actions',20),
  ('Influenciador','Receba 50 curtidas em suas dicas','⭐','likes_received',50),
  ('Eco Líder','Alcance o top 10% da comunidade','🌍','top_percent',10),
  ('Guardião Verde','Atinja o nível máximo','🏆','points',5000);

INSERT IGNORE INTO eco_actions (user_id, action_type, icon, co2_saved, points_earned) VALUES
  (2,'Usei transporte público','🚌',2.30,120),
  (2,'Reciclei resíduos','♻️',1.80,100),
  (3,'Economizei água','💧',0.90,80);
