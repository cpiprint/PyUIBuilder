class ZIndexPlugin {
    constructor(manager, options) {
      this.manager = manager;
      this.options = options || {};
      this.originalZIndexValues = new Map();
    }
  
    registerEffect() {
      const handleDragStart = (event) => {
        const { active } = event;
        const draggableElement = document.getElementById(active.id);
  
        if (draggableElement) {
          // Store the original z-index
          this.originalZIndexValues.set(active.id, draggableElement.style.zIndex);
  
          // Apply the dragged z-index
          draggableElement.style.zIndex = this.options.draggedZIndex || '9999';
        }
      };
  
      const handleDragEnd = (event) => {
        const { active } = event;
        const draggableElement = document.getElementById(active.id);
  
        if (draggableElement) {
          // Restore the original z-index
          const originalZIndex = this.originalZIndexValues.get(active.id) || '';
          draggableElement.style.zIndex = originalZIndex;
          this.originalZIndexValues.delete(active.id);
        }
      };
  
      // Listen for drag events
      this.manager.addEventListener('dragstart', handleDragStart);
      this.manager.addEventListener('dragend', handleDragEnd);
  
      // Return cleanup function
      return () => {
        this.manager.removeEventListener('dragstart', handleDragStart);
        this.manager.removeEventListener('dragend', handleDragEnd);
      };
    }
  }
  
export default ZIndexPlugin;
  