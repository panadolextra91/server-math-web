CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  player_name VARCHAR(64) NOT NULL,
  mode ENUM('arithmetic','equation') NULL,
  difficulty ENUM('easy','medium','hard') NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  mode ENUM('arithmetic','equation') NOT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL,
  payload JSON NOT NULL,
  answer VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS answer_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NULL,
  mode ENUM('arithmetic','equation') NOT NULL,
  difficulty ENUM('easy','medium','hard') NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer VARCHAR(255) NOT NULL,
  user_answer VARCHAR(255) NOT NULL,
  is_correct TINYINT(1) NOT NULL,
  score_delta INT NOT NULL,
  elapsed_ms INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_answer_session FOREIGN KEY (session_id) REFERENCES sessions(id),
  CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE INDEX idx_answer_logs_session ON answer_logs(session_id);
CREATE INDEX idx_answer_logs_mode_diff ON answer_logs(mode, difficulty);
CREATE INDEX idx_answer_logs_created_at ON answer_logs(created_at);
CREATE INDEX idx_sessions_player_name ON sessions(player_name);
CREATE INDEX idx_sessions_player_name_started ON sessions(player_name, started_at);


