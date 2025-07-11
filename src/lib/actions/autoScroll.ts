// actions.ts
export function autoScroll(node: HTMLElement, shouldScroll: boolean) {
    if (shouldScroll) {
        // 延迟执行，确保 DOM 渲染完成
        setTimeout(() => {
            node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    }

    return {
        update(newShouldScroll: boolean) {
            if (newShouldScroll) {
                setTimeout(() => {
                    node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                });
            }
        }
    };
}
