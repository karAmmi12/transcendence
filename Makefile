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

install:

dev:

prod:
	@echo "$(BLUE)Lauching production mode...$(END)"
	@$(DC) up --build
	@echo "$(GREEN)Containers has starded in production mode! Access here http://localhost:3000 !$(END)"
	
down:
	@$(DC) down

clean:

logs:

restart:

.PHONY: help install dev prod down clean logs restart
