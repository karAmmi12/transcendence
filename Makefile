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

dev:
	@echo "$(BLUE)Lauching in dev mode...$(END)"
	@echo "$(YELLOW)Starting backend and frontend in development mode...$(END)"
	@cd ./backend && npm run dev & \
	cd ./frontend && npm run dev & \
	wait
	@echo "$(GREEN)Development servers started!$(END)"

prod:
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
	@echo "$(YELLOW)Cleaning containers and images...$(END)"
	@$(DC) down --rmi all --volumes --remove-orphans
	@echo "$(GREEN)Cleanup completed!$(END)"

logs:
	@$(DC) logs -f

restart:
	@echo "$(YELLOW)Restarting containers...$(END)"
	@$(DC) restart
	@echo "$(GREEN)Containers restarted!$(END)"

.PHONY: help install dev prod down clean logs restart
