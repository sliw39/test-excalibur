export class HtmlScreen {
  constructor(public root: HTMLElement) {
    root.innerHTML = "";
  }
  async load(htmlUrl: string) {
    const response = await fetch(htmlUrl);
    const html = await response.text();
    this.insert(html);
  }
  insert(html: string) {
    this.root.innerHTML = html;
  }

  q<T extends Element = HTMLElement>(
    selector: string,
    ifDefined: (element: T) => void
  ): T | undefined {
    const element = this.root.querySelector(selector)!;
    if (element) {
      ifDefined(element as T);
    }
    return element as T;
  }

  bindEvent(element: string | Element, event: string, callback: Function) {
    if (typeof element === "string") {
      element = document.querySelector(element)!;
    }
    if (!element) return;
    element.addEventListener(event, () => callback());
  }
}

export function newScreen(root = document.getElementById("ui")!) {
  return new HtmlScreen(root);
}
