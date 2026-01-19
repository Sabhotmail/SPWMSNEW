#!/bin/bash

# Docker Deployment Helper Script
# Quick commands for managing Docker deployment

set -e

COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'

log_info() { echo -e "${COLOR_BLUE}ℹ${COLOR_RESET} $1"; }
log_success() { echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"; }
log_warning() { echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} $1"; }
log_error() { echo -e "${COLOR_RED}✗${COLOR_RESET} $1"; }

show_help() {
  cat << EOF
🐳 SPWMS Docker Deployment Helper

Usage: ./docker-deploy.sh [COMMAND]

Commands:
  start       Start all services
  stop        Stop all services
  restart     Restart all services
  build       Build/rebuild images
  logs        View logs (follows)
  status      Show service status
  shell       Open shell in app container
  db-shell    Open PostgreSQL shell
  db-backup   Create database backup
  db-restore  Restore database backup
  clean       Clean up containers and volumes
  help        Show this help message

Examples:
  ./docker-deploy.sh start
  ./docker-deploy.sh logs
  ./docker-deploy.sh db-backup

EOF
}

check_env() {
  if [ ! -f ".env.docker" ]; then
    log_error ".env.docker file not found!"
    log_info "Copy from template: cp .env.docker.example .env.docker"
    exit 1
  fi
}

case "$1" in
  start)
    check_env
    log_info "Starting SPWMS services..."
    docker-compose --env-file .env.docker up -d
    log_success "Services started!"
    log_info "Access at: http://localhost:3000"
    ;;

  stop)
    log_info "Stopping services..."
    docker-compose stop
    log_success "Services stopped"
    ;;

  restart)
    log_info "Restarting services..."
    docker-compose restart
    log_success "Services restarted"
    ;;

  build)
    check_env
    log_info "Building Docker images..."
    docker-compose --env-file .env.docker build --no-cache
    log_success "Build complete"
    ;;

  logs)
    docker-compose logs -f
    ;;

  status)
    docker-compose ps
    ;;

  shell)
    log_info "Opening shell in app container..."
    docker-compose exec app sh
    ;;

  db-shell)
    log_info "Opening PostgreSQL shell..."
    docker-compose exec postgres psql -U spwms_user -d spwms_production
    ;;

  db-backup)
    BACKUP_FILE="backups/db_$(date +%Y%m%d_%H%M%S).sql"
    mkdir -p backups
    log_info "Creating database backup..."
    docker-compose exec -T postgres pg_dump -U spwms_user spwms_production > "$BACKUP_FILE"
    log_success "Backup created: $BACKUP_FILE"
    ;;

  db-restore)
    if [ -z "$2" ]; then
      log_error "Please specify backup file"
      log_info "Usage: ./docker-deploy.sh db-restore <backup-file>"
      exit 1
    fi
    log_warning "This will replace current database!"
    read -p "Continue? (y/N): " confirm
    if [ "$confirm" = "y" ]; then
      log_info "Restoring database..."
      docker-compose exec -T postgres psql -U spwms_user spwms_production < "$2"
      log_success "Database restored"
    fi
    ;;

  clean)
    log_warning "This will remove all containers and volumes!"
    read -p "Continue? (y/N): " confirm
    if [ "$confirm" = "y" ]; then
      docker-compose down -v
      log_success "Cleanup complete"
    fi
    ;;

  help|--help|-h|"")
    show_help
    ;;

  *)
    log_error "Unknown command: $1"
    show_help
    exit 1
    ;;
esac
