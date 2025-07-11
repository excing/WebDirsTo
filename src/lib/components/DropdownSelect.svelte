<script lang="ts">
    import { autoScroll } from "$lib/actions/autoScroll";

  interface Props {
    value: string;
    options: string[];
    placeholder?: string;
    disabled?: boolean;
    allowCustom?: boolean;
    maxHeight?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(),
    options = [],
    placeholder = "请选择或输入",
    disabled = false,
    allowCustom = true,
    maxHeight = "240px",
    onchange
  }: Props = $props();

  // 组件状态
  let isOpen = $state(false);
  let inputRef = $state<HTMLInputElement>();
  let dropdownRef = $state<HTMLDivElement>();
  let highlightedIndex = $state(-1);

  // 过滤后的选项
  let filteredOptions = $derived.by(() => {
    if (!value.trim()) {
      return options;
    }
    return options.filter(option =>
      option.toLowerCase().includes(value.toLowerCase())
    );
  });

  // 打开下拉框
  function openDropdown() {
    if (disabled) return;
    isOpen = true;
    highlightedIndex = -1;
  }

  // 关闭下拉框
  function closeDropdown() {
    isOpen = false;
    highlightedIndex = -1;
  }

  // 切换下拉框状态
  function toggleDropdown(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  // 选择选项
  function selectOption(option: string) {
    value = option;
    closeDropdown();
    onchange?.(option);
  }

  // 处理输入变化
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    
    // if (!isOpen) {
    //   openDropdown();
    // }
    
    highlightedIndex = -1;
    onchange?.(target.value);
  }

  // 处理键盘事件
  function handleKeydown(event: KeyboardEvent) {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          highlightedIndex = Math.max(highlightedIndex - 1, -1);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          selectOption(filteredOptions[highlightedIndex]);
        } else if (!isOpen) {
          openDropdown();
        }
        break;

      case 'Escape':
        event.preventDefault();
        closeDropdown();
        inputRef?.blur();
        break;

      case 'Tab':
        closeDropdown();
        break;
    }
  }

  // 处理输入框聚焦
  function handleFocus() {
    if (!disabled) {
      openDropdown();
    }
  }

  // 处理输入框失焦
  function handleBlur(event: FocusEvent) {
    // 检查焦点是否移动到下拉框内
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (dropdownRef && dropdownRef.contains(relatedTarget)) {
      return;
    }
    
    // 延迟关闭，允许点击选项
    setTimeout(() => {
      closeDropdown();
    }, 150);
  }

  // 处理选项点击
  function handleOptionClick(option: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    selectOption(option);
  }

  // 清空输入
  function clearInput(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    value = '';
    closeDropdown();
    inputRef?.focus();
    onchange?.('');
  }

  // 点击外部关闭
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (inputRef && !inputRef.contains(target) && 
        dropdownRef && !dropdownRef.contains(target)) {
      closeDropdown();
    }
  }

  // 监听全局点击事件
  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
</script>

<div class="relative w-full">
  <!-- 输入框容器 -->
  <div class="relative">
    <input
      bind:this={inputRef}
      type="text"
      bind:value={value}
      {placeholder}
      {disabled}
      readonly={!allowCustom}
      class="w-full px-3 py-2 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg
             focus:ring-2 focus:ring-blue-500 focus:border-transparent
             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
             placeholder-gray-500 dark:placeholder-gray-400
             disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
             {!allowCustom ? 'cursor-pointer' : ''}"
      oninput={handleInput}
      onfocus={handleFocus}
      onblur={handleBlur}
      onkeydown={handleKeydown}
      autocomplete="off"
    />
        
    <!-- 删除按钮 -->
    {#if value && !disabled}
      <button
        type="button"
        onclick={clearInput}
        class="absolute inset-y-0 right-8 flex items-center px-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
               transition-colors"
        aria-label="清空输入"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    {/if}

    <!-- 下拉箭头 -->
    <button
      type="button"
      onclick={toggleDropdown}
      {disabled}
      class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
             disabled:cursor-not-allowed transition-colors"
      aria-label="展开选项"
    >
      <svg
        class="w-4 h-4 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  </div>

  <!-- 下拉选项 -->
  {#if isOpen && !disabled}
    <div
      bind:this={dropdownRef}
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
             rounded-lg shadow-lg overflow-hidden"
      style="max-height: {maxHeight}"
    >
      <div class="overflow-y-auto" style="max-height: {maxHeight}">
        {#if filteredOptions.length > 0}
          {#each filteredOptions as option, index}
            <button
              use:autoScroll={index === highlightedIndex}
              type="button"
              class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 
                     text-gray-900 dark:text-white transition-colors border-none bg-transparent
                     {index === highlightedIndex ? 'bg-gray-100 dark:bg-gray-600' : ''}
                     {value === option ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}"
              onclick={(e) => handleOptionClick(option, e)}
            >
              {option}
            </button>
          {/each}
        {:else}
          <div class="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
            {allowCustom ? '没有匹配的选项' : '没有可选项'}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* 确保下拉框在移动端正确显示 */
  @media (max-width: 640px) {
    /* 防止下拉框被裁剪 */
    /* .relative {
      overflow: visible;
    } */
  }
</style>
