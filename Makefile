# **************************************************************************** #
#                                  VARIABLES                                   #
# **************************************************************************** #

DC = docker compose

# COLORS
GREY			=	\033[0;30m
RED				=	\033[0;31m
GREEN			=	\033[0;32m
YELLOW			=	\033[0;33m
BLUE			=	\033[0;34m
PURPLE			=	\033[0;35m
CYAN			=	\033[0;36m
WHITE			=	\033[0;37m

END				=	\033[0m

# **************************************************************************** #
#                                    RULES                                     #
# **************************************************************************** #

help:
	@echo "$(BLUE)Transcendence - Available commands:$(END)"
	@echo "  $(CYAN)make dev$(END)	  - Start development mode"
	@echo "  $(CYAN)make prod$(END)	  - Start production mode (Docker)"
	@echo "  $(CYAN)make down$(END)	  - Stop all containers"
	@echo "  $(CYAN)make logs$(END)	  - Show container logs"
	@echo "  $(CYAN)make restart$(END)	  - Restart containers"
	@echo "  $(CYAN)make clean$(END)	  - Clean containers and images"

install:
	@echo "$(BLUE)Installing dependencies...$(END)"
	@cd ./backend && npm install
	@cd ./frontend && npm install
	@echo "$(GREEN)Dependencies installed!$(END)"

set-dev-env:
	@echo "$(YELLOW)Setting NODE_ENV=development...$(END)"
	@sed -i 's/NODE_ENV=.*/NODE_ENV=development/' .env
	@sed -i 's|API_URL_FRONT=.*|API_URL_FRONT="http://localhost:5173/"|' .env
	@cp .env backend/.env

set-prod-env:
	@echo "$(YELLOW)Setting NODE_ENV=production...$(END)"
	@sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
	@sed -i 's|API_URL_FRONT=.*|API_URL_FRONT="https://localhost:8443/"|' .env
	@rm -f backend/.env

dev: set-dev-env install
	@echo "$(BLUE)Lauching in dev mode...$(END)"
	@echo "$(YELLOW)Starting backend and frontend in development mode...$(END)"
	@cd ./backend && npm run dev & \
	cd ./frontend && npm run dev & \
	wait
	@echo "$(GREEN)Development servers started!$(END)"

prod: set-prod-env
	@echo "$(BLUE)Launching in prod mode...$(END)"
	@$(DC) up --build -d
	@echo "$(GREEN)Containers have started in production mode!$(END)"
	@echo "$(CYAN)Access your app here: http://localhost:8080$(END)"
	@echo "$(CYAN)HTTPS access: https://localhost:8443$(END)"
	
down:
	@echo "$(YELLOW)Stopping containers...$(END)"
	@$(DC) down
	@echo "$(GREEN)Containers stopped!$(END)"

clean:
	@echo "$(YELLOW)Performing total reset and cleanup...$(END)"
	@clear
	@$(DC) down --rmi all --volumes --remove-orphans
	@docker system prune -a -f
	@docker volume prune -f
	@rm -rf backend/node_modules frontend/node_modules frontend/dist backend/dist
	@rm -rf backend/database.db  # Supprime la DB locale
	@rm -f backend/package-lock.json frontend/package-lock.json  # Suppression des locks
	@npm cache clean --force
	@echo "$(GREEN)Total reset and cleanup completed!$(END)"
	@echo "$(CYAN)Run 'make prod' to restart in production mode.$(END)"
	@rm -f backend/.env

logs:
	@$(DC) logs -f

restart:
	@echo "$(YELLOW)Restarting containers...$(END)"
	@$(DC) restart
	@echo "$(GREEN)Containers restarted!$(END)"

.PHONY: help install dev prod down clean logs restart set-dev-env set-dev-env
