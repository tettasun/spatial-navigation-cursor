// @flow

/*::
type cursorManager$Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type spatialNavigationCursor$EventListener = {
  type: string;
  listener: spatialNavigationCursor$EventHandler;
};

export class spatialNavigationCursor$FocusUpdatedEvent extends CustomEvent {
  detail: {
    target: HTMLElement;
  };
}

export type spatialNavigationCursor$EventHandler = (event: spatialNavigationCursor$FocusUpdatedEvent) => mixed;

export type spatialNavigationCursor$Events = {
  FOCUS_UPDATED: 'focusUpdated';
};
*/

export default class CursorManager {
  /*::
  static Events: spatialNavigationCursor$Events;
  root_: HTMLElement;
  cursor_: HTMLElement;
  focused_: ?HTMLElement;
  freezed_: boolean;
  focusClassName_: string;
  viewHeight_: number;
  observer_: ?MutationObserver;
  eventListeners_: spatialNavigationCursor$EventListener[];
  */

  /**
   * @param {Object} props
   * @param {HTMLElement} props.root an HTML element to use as its root
   * @param {string} props.focusClassName a css class name to identify the focused element
   */
  constructor({ root, focusClassName }/*: {
    root: HTMLElement,
    focusClassName: string,
  }*/) {
    /**
     * @type {HTMLElement}
     * @access private
     */
    this.root_ = root;

    /**
     * @type {string}
     * @access private
     */
    this.focusClassName_ = focusClassName;

    /**
     * @type {HTMLElement}
     * @access private
     */
    this.cursor_ = document.createElement('div');

    /**
     * @type {HTMLElement}
     * @access private
     */
    this.focused_ = null;

    /**
     * @type {boolean}
     * @access private
     */
    this.freezed_ = false;

    /**
     * @type {string}
     * @access private
     */
    this.viewHeight_ = window.innerHeight;

    /**
     * @type {MutationObserver}
     * @access private
     */
    this.observer_ = null;

    /**
     * @type {Object[]}
     * @access private
     */
    this.eventListeners_ = [];
  }

  /**
   * Start the manager
   */
  start()/*: void*/ {
    this.styleCursor_();
    this.appendToRoot_();
    this.observeFocus_();
    this.focus();
  }

  /**
   * Resume the manager
   */
  resume()/*: void*/ {
    this.freezed_ = false;
    this.focus();
  }

  /**
   * Stop the manager
   */
  stop()/*: void*/ {
    this.removeFromRoot_();
    this.disconnectFocus_();
  }

  /**
   * Freeze the cursor
   */
  freeze() {
    this.freezed_ = true;
  }

  /**
   * Focus on the element with the cursor
   */
  focus()/*: void*/ {
    if (!this.focused_ || this.cursor_.style.display === 'none') {
      this.place();
    } else {
      this.move();
    }
  }

  /**
   * Place the cursor
   */
  place()/*: void*/ {
    const focused = isInDocumentBody(this.focused_) ? this.focused_ : document.querySelector(`.${ this.focusClassName_ }`);
    if (!focused) {
      this.hideCursor_();
      return;
    }

    const origTransitionDuration = this.cursor_.style.transitionDuration;
    this.cursor_.style.transitionDuration = '0';
    const r = getAbsoluteElementRect(focused);
    this.scrollIntoView_(r);
    this.resizeCursorTo_(r);
    this.moveCursorTo_(r);
    if (!focused.classList.contains(this.focusClassName_)) {
      this.hideCursor_();
    } else {
      this.showCursor_();
    }
    this.cursor_.style.transitionDuration = origTransitionDuration;
  }

  /**
   * Move the cursor
   */
  move()/*: void*/ {
    const focused = isInDocumentBody(this.focused_) ? this.focused_ : document.querySelector(`.${ this.focusClassName_ }`);
    if (!focused || !focused.classList.contains(this.focusClassName_)) {
      this.hideCursor_();
      return;
    } else {
      this.showCursor_();
    }

    const r = getAbsoluteElementRect(focused);
    this.scrollIntoView_(r);
    this.resizeCursorTo_(r);
    this.moveCursorTo_(r);
  }

  /**
   * Get the cursor element
   * @return {HTMLElement} the cursor element
   */
  getCursor()/*: HTMLElement*/ {
    return this.cursor_;
  }

  /**
   * Add an event listener
   * @return {HTMLElement} the focused element
   */
  getFocusedElement()/*: ?HTMLElement*/ {
    return this.focused_;
  }

  /**
   * Add an event listener
   * @param {string} type an event type
   * @param {Function} listener an evnet handler 
   */
  addEventListener(type/*: string*/, listener/*: spatialNavigationCursor$EventHandler*/) {
    this.eventListeners_.push({ type, listener });
  }

  /**
   * Remove an event listener
   * @param {string} type an event type
   * @param {Function} listener an evnet handler 
   */
  removeEventListener(type/*: string*/, listener/*: spatialNavigationCursor$EventHandler*/) {
    const idx = this.eventListeners_.findIndex(l => l.type === type && l.listener === listener);
    if (~idx) {
      this.eventListeners_.splice(idx, 1);
    }
  }

  /**
   * Scroll into view of destination rect
   * @access private
   * @param {cursorManager$Rect} rect the destination rect
   * @param {number} rect.top
   * @param {number} rect.left
   * @param {number} rect.width
   * @param {number} rect.height
   */
  scrollIntoView_(rect/*: cursorManager$Rect*/)/*: void*/ {
    const left = window.pageXOffset;
    window.scroll({
      left,
      top: rect.top - (window.innerHeight * 0.5) + (rect.height * 0.5),
      behavior: 'smooth',
    });
  }

  /**
   * Move the cursor to the destination rect
   * @access private
   * @param {cursorManager$Rect} rect the destination rect to scroll to
   * @param {number} rect.top
   * @param {number} rect.left
   * @param {number} rect.width
   * @param {number} rect.height
   */
  moveCursorTo_(rect/*: cursorManager$Rect*/)/*: void*/ {
    const style = getComputedStyle(this.cursor_, '');
    const borserTop = parseInt(style.borderTopWidth, 10);
    const borserLeft = parseInt(style.borderLeftWidth, 10);
    this.cursor_.style.transform = `translate3d(${ rect.left - borserLeft }px, ${ rect.top - borserTop }px, 0)`;
  }

  /**
   * Move the cursor to the destination rect
   * @access private
   * @param {cursorManager$Rect} rect the destination rect to scroll to
   * @param {number} rect.top
   * @param {number} rect.left
   * @param {number} rect.width
   * @param {number} rect.height
   */
  resizeCursorTo_(rect/*: cursorManager$Rect*/)/*: void*/ {
    this.cursor_.style.width = `${ rect.width }px`;
    this.cursor_.style.height = `${ rect.height }px`;
  }

  /**
   * Style the cursor
   * @access private
   */
  styleCursor_()/*: void*/ {
    this.cursor_.classList.add('__spatial-navigation-cursor__');
    this.cursor_.style.position = 'absolute';
    this.cursor_.style.top = '0';
    this.cursor_.style.left = '0';
    this.hideCursor_();
  }

  /**
   * Hide the cursor
   * @access private
   */
  hideCursor_()/*: void*/ {
    this.cursor_.style.display = 'none';
  }

  /**
   * Show the cursor
   * @access private
   */
  showCursor_()/*: void*/ {
    this.cursor_.style.display = '';
  }

  /**
   * Append the cursor to the root
   * @access private
   */
  appendToRoot_()/*: void*/ {
    this.root_.appendChild(this.cursor_);
  }

  /**
   * Append the cursor to the root
   * @access private
   */
  removeFromRoot_()/*: void*/ {
    this.root_.removeChild(this.cursor_);
  }

  /**
   * Observe the change of focused elements
   * @access private
   */
  observeFocus_() {
    const observer = this.observer_ = new MutationObserver((mutationRecords) => {
      var target;
      for (let mutation of mutationRecords) {
        if ( (mutation.target/*: any*/).classList.contains(this.focusClassName_) ) {
          target = mutation.target;
          break;
        }
      }
      if (target) {
        this.focused_ = ((target/*: any*/)/*: HTMLElement*/);
        if (!this.freezed_) this.focus();
        this.trigger_(CursorManager.Events.FOCUS_UPDATED, new CustomEvent(CursorManager.Events.FOCUS_UPDATED, {
          detail: { target },
        }));
      } else {
        this.hideCursor_();
      }
    });
    observer.observe(this.root_, {
      attributeFilter: [ "class" ],
      attributes: true,
      subtree: true,
    });
  }

  /**
   * Stop Observering the change of focused elements
   * @access private
   */
  disconnectFocus_()/*: void*/ {
    if (!this.observer_) return;
    this.observer_.disconnect();
  }

  /**
   * Trigger an event
   * @access private
   * @param {string} type an event type
   * @param {...*} args an event type
   */
  trigger_(type/*: string*/, ...args/*: any[]*/)/*: void*/ {
    this.eventListeners_
      .filter(l => l.type === type)
      .forEach(l => l.listener(...args));
  }
}

CursorManager.Events = {
  FOCUS_UPDATED: 'focusUpdated',
};

/**
 * Get an element rect with its absolute location
 * @param {HTMLElement} elem an HTML element
 * @return {cursorManager$Rect} the element rect with its absolute location
 */
function getAbsoluteElementRect(elem/*: HTMLElement*/)/* cursorManager$Rect*/ {
  const r = elem.getBoundingClientRect();
  return { left: r.left + window.pageXOffset, top: r.top + window.pageYOffset, width: r.width, height: r.height };
}

/**
 * Check if an element is in the document body
 * @param {HTMLElement} element an HTML element
 * @return {boolean} whether the element is the document body
 */
function isInDocumentBody(element/*: ?HTMLElement*/)/*: boolean*/ {
  if (!element) return false;
  if (element === document.body) return true;
  if (!element.offsetParent) return false;
  return isInDocumentBody((element.offsetParent/*: any*/));
}
