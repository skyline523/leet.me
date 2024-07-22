import type MarkdownIt from 'markdown-it'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import container from 'markdown-it-container'
import { nanoid } from 'nanoid'

interface Options {
  codeCopyButtonTitle: string
  hasSingleTheme: boolean
}

export function containerPlugin(md: MarkdownIt, options: Options, containerOptions?: ContainerOptions) {
  md.use(...createContainer('tip', containerOptions?.tipLabel || 'Tip', md))
    .use(...createContainer('warning', containerOptions?.warningLabel || 'Warning', md))
    .use(...createContainer('danger', containerOptions?.dangerLabel || 'Danger', md))
    .use(...createContainer('info', containerOptions?.infoLabel || 'Info', md))
    .use(...createContainer('details', containerOptions?.detailsLabel || 'Details', md))
    .use(...createCodeGroup())
}

type ContainerArgs = [typeof container, string, { render: RenderRule }]

/**
 *
 * @param klass - container类型
 * @param defaultTitle - container标题
 * @param md - markdown-it实例
 */
function createContainer(
  klass: string,
  defaultTitle: string,
  md: MarkdownIt,
): ContainerArgs {
  return [
    container,
    klass,
    {
      render(tokens, idx, _options, env: { references?: any }) {
        const token = tokens[idx]
        const info = token.info.trim().slice(klass.length).trim()
        const attrs = md.renderer.renderAttrs(token)
        if (token.nesting === 1) {
          const title = md.renderInline(info || defaultTitle, {
            references: env.references,
          })
          if (klass === 'details')
            return `<details class="${klass} custom-block"${attrs}><summary>${title}</summary>\n`
          return `<div class="${klass} custom-block"${attrs}><p class="custom-block-title">${title}</p>\n`
        }
        else {
          return klass === 'details' ? `</details>\n` : `</div>\n`
        }
      },
    },
  ]
}

/**
 * 利用input的radio的checked来实现code-group的切换
 */
function createCodeGroup(): ContainerArgs {
  return [
    container,
    'code-group',
    {
      render(tokens, idx) {
        if (tokens[idx].nesting === 1) {
          const name = nanoid(5)
          let tabs = ''
          let checked = 'checked'

          for (
            let i = idx + 1;
            !(
              tokens[i].nesting === -1
              && tokens[i].type === 'container_code-group_close'
            );
            i++
          ) {
            // 因为代码块中都是由span行内元素组成，通过code块元素包裹的，所有需要判断父元素是否是块元素
            const isHtml = tokens[i].type === 'html_block'

            if ((tokens[i].type === 'fence' && tokens[i].tag === 'code') || isHtml) {
              // 用于提取代码块的属性，比如```js {}或```js []等
              const title = extractTitle(isHtml ? tokens[i].content : tokens[i].info, isHtml)

              if (title) {
                const id = nanoid(7)
                tabs += `<input type="radio" name="group-${name}" id="tab-${id}" ${checked}><label for="tab-${id}">${title}</label>`

                if (checked && !isHtml)
                  tokens[i].info += ' active'
                checked = ''
              }
            }
          }

          return `<div class="code-group"><div class="tabs">${tabs}</div><div class="blocks">\n`
        }
        return `</div></div>\n`
      },
    },
  ]
}

/**
 * 去除块内注释并提取data-title属性值
 */
export function extractTitle(info: string, html = false) {
  if (html) {
    return (
      info.replace(/<!--[\s\S]*?-->/g, '').match(/data-title="(.*?)"/)?.[1] || ''
    )
  }
  return info.match(/\[(.*)\]/)?.[1] || extractLang(info) || 'txt'
}

/**
 * 提取代码块的语言，```js = js
 */
export function extractLang(info: string) {
  return info
    .trim()
    .replace(/=(\d*)/, '')
    // eslint-disable-next-line regexp/optimal-quantifier-concatenation
    .replace(/:(no-)?line-numbers(\{| |$|=\d*).*/, '')
    .replace(/(-vue|\{| ).*$/, '')
    .replace(/^vue-html$/, 'template')
    .replace(/^ansi$/, '')
}

export interface ContainerOptions {
  infoLabel?: string
  noteLabel?: string
  tipLabel?: string
  warningLabel?: string
  dangerLabel?: string
  detailsLabel?: string
  importantLabel?: string
  cautionLabel?: string
}
