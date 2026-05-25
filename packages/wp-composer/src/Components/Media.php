<?php
/**
 * Media — WordPress media library trigger button.
 *
 * Renders the button + hidden field that JS hooks into to open wp.media().
 * Requires wp_enqueue_media() to be called on the page.
 *
 * The component emits everything you need but assumes you'll wire up the
 * JS init. A minimal init script is shown in the README and AI prompt.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP\Components;

use PluginSDK\WP\Html;

final class Media {

    /**
     * Render a media-library button + preview thumbnail + hidden id input.
     *
     * @param array<string, mixed> $args {
     *     @var string $name           Hidden input name (stores the attachment ID).
     *     @var int    $value          Initially-selected attachment ID.
     *     @var string $preview_url    Initially-selected preview image URL.
     *     @var string $label          Button label. Default 'Select Media'.
     *     @var string $modal_title    wp.media modal title. Default 'Select or Upload Media'.
     *     @var string $modal_button   wp.media confirm-button label.
     *     @var bool   $multiple       Allow multiple selection.
     *     @var string $library_type   Restrict wp.media to 'image', 'video', 'audio', etc.
     *     @var string $accept         MIME-type filter for the native fallback file input
     *                                 (e.g. 'image/*,application/pdf').
     *     @var bool   $dropzone       Render as a drop zone (dashed border + click anywhere)
     *                                 instead of a button.
     *     @var string $id             Element id used to scope the JS init.
     * }
     */
    public static function media_button(array $args = []): string {
        $name          = $args['name']         ?? 'attachment_id';
        $value         = $args['value']        ?? '';
        $preview_url   = $args['preview_url']  ?? '';
        $label         = $args['label']        ?? 'Select Media';
        $modal_title   = $args['modal_title']  ?? 'Select or Upload Media';
        $modal_button  = $args['modal_button'] ?? 'Use this media';
        $multiple      = !empty($args['multiple']);
        $library_type  = $args['library_type'] ?? '';
        $accept        = $args['accept']       ?? '';
        $dropzone      = !empty($args['dropzone']);
        $id            = $args['id']           ?? 'wpa-media-' . substr(md5((string) microtime(true)), 0, 8);

        $preview_style = $preview_url
            ? sprintf('background-image:url(%s)', esc_url($preview_url ?? ''))
            : '';

        $preview = Html::tag('span', [
            'class' => 'wp-admin-media__preview',
            'style' => $preview_style ?: null,
            'aria-hidden' => 'true',
            'data-wpa-media-preview' => $id,
        ], '');

        $hidden_data_attrs = [
            'data-wpa-media-trigger' => $id,
            'data-wpa-modal-title'   => $modal_title,
            'data-wpa-modal-button'  => $modal_button,
            'data-wpa-multiple'      => $multiple ? '1' : '0',
            'data-wpa-library-type'  => $library_type ?: null,
            'data-wpa-accept'        => $accept ?: null,
        ];

        $hidden_id_input = Html::tag('input', [
            'type'  => 'hidden',
            'name'  => $name,
            'value' => (string) $value,
            'id'    => $id,
            'data-wpa-media-id' => $id,
        ], '', true);

        $file_fallback = $accept
            ? Html::tag('input', [
                'type'     => 'file',
                'accept'   => $accept,
                'multiple' => $multiple,
                'data-wpa-media-file' => $id,
                'style'    => 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none',
            ], '', true)
            : '';

        if ($dropzone) {
            $inner = $preview
                . Html::tag('span', ['class' => 'wp-admin-media-dropzone__label'], Html::esc($label))
                . $hidden_id_input
                . $file_fallback;
            return Html::tag('label', array_merge([
                'class' => 'wp-admin-media-dropzone',
            ], $hidden_data_attrs), $inner);
        }

        $button = Button::render($label, ['attrs' => $hidden_data_attrs]);

        return Html::tag('span', ['class' => 'wp-admin-media'],
            $preview . $button . $hidden_id_input . $file_fallback);
    }

    /**
     * Inline JS snippet that initializes the media-library modal for any
     * button rendered by media_button(). Echo this once on your settings
     * page (after enqueueing wp_enqueue_media()) — it discovers buttons
     * by data attributes and wires them up.
     *
     * Echo with wp_print_inline_script_tag() or inside wp_add_inline_script()
     * for proper script enqueue ordering.
     */
    public static function media_button_init_js(): string {
        return <<<'JS'
(function () {
  if (typeof wp === 'undefined' || !wp.media) return;
  var frames = {};
  document.querySelectorAll('[data-wpa-media-trigger]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var id = btn.getAttribute('data-wpa-media-trigger');
      if (!frames[id]) {
        var libType = btn.getAttribute('data-wpa-library-type');
        frames[id] = wp.media({
          title:    btn.getAttribute('data-wpa-modal-title')  || 'Select Media',
          button:   { text: btn.getAttribute('data-wpa-modal-button') || 'Use this media' },
          multiple: btn.getAttribute('data-wpa-multiple') === '1',
          library:  libType ? { type: libType } : undefined
        });
        frames[id].on('select', function () {
          var att = frames[id].state().get('selection').first().toJSON();
          var input = document.querySelector('[data-wpa-media-id="' + id + '"]');
          if (input) input.value = att.id;
          var preview = document.querySelector('[data-wpa-media-preview="' + id + '"]');
          if (preview) preview.style.backgroundImage = 'url(' + att.url + ')';
        });
      }
      frames[id].open();
    });
  });
})();
JS;
    }
}
