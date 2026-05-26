DROP DATABASE IF EXISTS ecorun_sevilla;
CREATE DATABASE ecorun_sevilla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecorun_sevilla;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NULL,
  surname VARCHAR(100) NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  eco_points INT DEFAULT 0,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  run_name VARCHAR(100) NOT NULL,
  description TEXT,
  distance_km DECIMAL(8,2) NOT NULL,
  duration_minutes INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  run_date DATETIME NOT NULL,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  goal_type ENUM('distance', 'count') NOT NULL,
  goal_value DECIMAL(8,2) NOT NULL,
  start_date DATE,
  end_date DATE,
  reward_points INT DEFAULT 0,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  category VARCHAR(50) NOT NULL,
  zone VARCHAR(50) NULL,
  lat DECIMAL(10,7) NULL,
  lng DECIMAL(10,7) NULL,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  challenge_id INT NOT NULL,
  progress DECIMAL(8,2) DEFAULT 0,
  status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_challenge_id (challenge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  run_id INT NOT NULL,
  user_id INT NOT NULL,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_run_id (run_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO challenges (name, description, goal_type, goal_value, start_date, end_date, reward_points, difficulty, category, zone, lat, lng, active) VALUES
('Maratón de Sevilla', 'Completa 42.2 km en total durante el mes', 'distance', 42.20, '2026-02-01', '2026-02-28', 500, 'hard', 'Distancia', 'Centro', 37.3886, -5.9823, TRUE),
('Corredor Constante', 'Realiza 10 carreras este mes', 'count', 10.00, '2026-02-01', '2026-02-28', 300, 'medium', 'Frecuencia', 'Norte', 37.4090, -5.9920, TRUE),
('5K Primavera', 'Corre 5 km sin parar', 'distance', 5.00, '2026-02-10', '2026-03-10', 100, 'easy', 'Distancia', 'Sur', 37.3724, -5.9878, TRUE),
('Desafío Semanal', 'Corre 3 veces esta semana', 'count', 3.00, '2026-02-10', '2026-02-17', 50, 'easy', 'Frecuencia', 'Triana', 37.3826, -6.0017, TRUE),
('Media Maratón', 'Alcanza 21.1 km acumulados', 'distance', 21.10, '2026-02-01', '2026-03-31', 350, 'medium', 'Distancia', 'Norte', 37.4178, -5.8931, TRUE),
('Reto 100K', 'Acumula 100 km en un mes', 'distance', 100.00, '2026-02-01', '2026-02-28', 800, 'hard', 'Distancia', 'Este', 37.4178, -5.8931, TRUE),
('Velocista', 'Corre 1 km en menos de 5 minutos', 'distance', 1.00, '2026-02-12', '2026-03-12', 150, 'medium', 'Velocidad', 'Centro', 37.3965, -5.9930, TRUE),
('Corredor Urbano', 'Completa 15 carreras en la ciudad', 'count', 15.00, '2026-02-01', '2026-04-30', 400, 'hard', 'Frecuencia', 'Sur', 37.3441, -5.9806, TRUE),
('Principiante Activo', 'Realiza tu primera carrera', 'count', 1.00, '2026-02-01', '2026-12-31', 20, 'easy', 'Iniciación', 'Centro', 37.3886, -5.9823, TRUE),
('Reto Parque María Luisa', 'Corre 10 km en el parque', 'distance', 10.00, '2026-02-15', '2026-03-15', 200, 'medium', 'Distancia', 'Sur', 37.3724, -5.9878, TRUE);
