import React, { useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
/* References:
 * https://medium.com/@daniela.sandoval/creating-a-popup-window-using-js-and-react-4c4bd125da57
 * https://github.com/rmariuzzo/react-new-window
 */

const fixUrlForRule = (cssRule: CSSRule) => {
  return cssRule.cssText
    .split("url(")
    .map((line) => {
      if (line[1] === "/") {
        return `${line.slice(0, 1)}${window.location.origin}${line.slice(1)}`;
      }
      return line;
    })
    .join("url(");
};

const copyStyles = (
  target: Document,
) => {
  const source = document;

  const headFrag = target.createDocumentFragment();

  Array.from(source.styleSheets).forEach((styleSheet) => {
    // For <style> elements
    let rules;
    try {
      rules = styleSheet.cssRules;
    } catch (err) {
      console.error(err);
    }

    if (rules) {
      const ruleText = Array.from(styleSheet.cssRules).map((cssRule) => {
        const type = cssRule.constructor.name;
        let returnText = "";

        if (["CSSImportRule", "CSSFontFaceRule"].includes(type)) {
          // Check if the cssRule type is CSSImportRule (3) or CSSFontFaceRule (5)
          // to handle local imports on a about:blank page
          // '/custom.css' turns to 'http://my-site.com/custom.css'
          returnText = fixUrlForRule(cssRule);
        } else {
          returnText = cssRule.cssText;
        }
        return returnText;
      });

      const newStyleEl = target.createElement("style");
      newStyleEl.textContent = ruleText.join("\n");
      headFrag.appendChild(newStyleEl);
    }
  });

  target.head.appendChild(headFrag);
};

export interface FloatingWindowProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  modal?: boolean;
  relTo?: HTMLElement;
  groupId?: string;
  isFloating?: (id: string) => boolean;
}

export const FloatingWindow: React.FC<React.PropsWithChildren<FloatingWindowProps>> = (props) => {
  const {
    children,
    isOpen,
    setIsOpen,
    title,
    width = 850,
    height = 600,
    left = -1,
    top = -1,
    modal = false,
    relTo = null,
  } = props;
  const [portalElement, setPortalElement] = useState<HTMLDivElement>(null);

  const externalWindow = useRef<Window>(null);

  useLayoutEffect(() => {
    if (isOpen) {
      if (externalWindow.current == null) {
        // Opens a new window and builds a template for the child to render in

        // Window referrs only to the root window, we want the parent/owner window when we can
        const parentWindow = relTo?.ownerDocument?.defaultView ?? window;

        // Calculate the center of the parent window in screen space
        const pcx = parentWindow.screenX + parentWindow.outerWidth / 2;
        const pcy = parentWindow.screenY + parentWindow.outerHeight / 2;

        // Use the center point to calcuate the left/top of the child window
        const centeredLeft = pcx - width / 2;
        const centeredTop = pcy - height / 2;

        const effectiveLeft = left >= 0 ? left : centeredLeft;
        const effectiveTop = top >= 0 ? top : centeredTop;

        externalWindow.current = window.open(
          "",
          "",
          `width=${width},height=${height},left=${effectiveLeft},top=${effectiveTop},modal=${modal}`,
        );

        if (externalWindow.current === null) {
          setIsOpen(false);
          return;
        }

        // Div used to offset titlebar height via padding
        const element = externalWindow.current.document.createElement("div");
        externalWindow.current.document.body.appendChild(element);

        externalWindow.current.document.title = title ?? "Floating Window";
        copyStyles(
          externalWindow.current.document,
        );

        setPortalElement(element);

        // Listener for closing the parent window
        // TODO: Consider preserving the children element somehow
        window.addEventListener("beforeunload", () => {
          if (externalWindow.current) {
            externalWindow.current.close();
            externalWindow.current = null;
          }
        });
        // Listener for closing the current window. Other libraries typically allow passing an onClose function into a floating component
        externalWindow.current.addEventListener("beforeunload", () => {
          setIsOpen(false);
        });
      } else {
        externalWindow.current.resizeTo(width, height);
      }
    } else {
      // closed is now false
      if (externalWindow.current) {
        externalWindow.current.close();
        externalWindow.current = null;
      }
    }
    // useEffect cleanup runs when this is unmounted for whatever reason (usually because parent is unmounted)
    return () => {
      if (externalWindow.current) {
        externalWindow.current.close();
        externalWindow.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, width, height, left, top, relTo]);

  // The title can change sometimes so this updates it without destroying the window
  useLayoutEffect(() => {
    if (externalWindow.current) {
      externalWindow.current.document.title = title;
    }
  }, [title]);


  if (!externalWindow.current) {
    return null;
  }

  return ReactDOM.createPortal(children, portalElement);
};
