#!/bin/bash
# Docker Test Harness for Homebridge Emporia Plugin

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Homebridge Emporia Plugin - Docker Test Harness${NC}"
echo "=================================================="
echo ""

# Function to print colored messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && \
   ! docker compose version &> /dev/null; then
    error "Docker Compose is not installed."
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Parse command line arguments
ACTION=${1:-"start"}

case "$ACTION" in
    start)
        info "Starting Homebridge test container..."
        info "(Plugin will be built inside the container)"
        $DOCKER_COMPOSE up -d homebridge
        sleep 5
        info "Homebridge is starting..."
        info "Access the UI at http://localhost:8581"
        info "View logs with: ./docker-test.sh logs"
        ;;
    
    stop)
        info "Stopping Homebridge test container..."
        $DOCKER_COMPOSE down
        info "Container stopped."
        ;;
    
    restart)
        info "Restarting Homebridge test container..."
        info "(Plugin will be rebuilt inside the container)"
        $DOCKER_COMPOSE restart homebridge
        info "Container restarted."
        ;;
    
    logs)
        info "Showing Homebridge logs (Ctrl+C to exit)..."
        $DOCKER_COMPOSE logs -f homebridge
        ;;
    
    build)
        info "Building plugin in container..."
        $DOCKER_COMPOSE exec homebridge bash -c "cd /tmp/homebridge-plugin-emporia && npm run build"
        info "Build complete."
        ;;
    
    rebuild)
        info "Rebuilding everything..."
        $DOCKER_COMPOSE down
        $DOCKER_COMPOSE up -d --build homebridge
        sleep 5
        info "Rebuild complete."
        ;;
    
    shell)
        info "Opening shell in Homebridge container..."
        docker exec -it homebridge-emporia-test /bin/bash
        ;;
    
    dev)
        info "Starting development environment..."
        $DOCKER_COMPOSE --profile dev up -d dev-environment
        info "Development container started."
        info "Access it with: ./docker-test.sh dev-shell"
        ;;
    
    dev-shell)
        info "Opening shell in development container..."
        docker exec -it homebridge-emporia-dev /bin/bash
        ;;
    
    clean)
        warn "This will remove all containers and volumes. Continue? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            info "Cleaning up..."
            $DOCKER_COMPOSE down -v
            docker volume rm homebridge-emporia_homebridge-data 2>/dev/null \
              || true
            info "Cleanup complete."
        else
            info "Cancelled."
        fi
        ;;
    
    help|*)
        echo "Usage: ./docker-test.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start      - Build and start Homebridge container (default)"
        echo "  stop       - Stop the container"
        echo "  restart    - Restart the container"
        echo "  logs       - Show container logs"
        echo "  build      - Build the plugin"
        echo "  rebuild    - Rebuild and restart everything"
        echo "  shell      - Open a shell in the Homebridge container"
        echo "  dev        - Start development environment"
        echo "  dev-shell  - Open shell in development container"
        echo "  clean      - Remove containers and volumes"
        echo "  help       - Show this help message"
        ;;
esac

