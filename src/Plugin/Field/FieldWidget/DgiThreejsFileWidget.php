<?php

namespace Drupal\dgi_3d_viewer\Plugin\Field\FieldWidget;

use Drupal\Core\Form\FormStateInterface;
use Drupal\file\Plugin\Field\FieldWidget\FileWidget;

/**
 * Plugin implementation of the 'dgi_threejs_file_widget' widget.
 *
 * @FieldWidget(
 *   id = "dgi_threejs_file_widget",
 *   label = @Translation("3D Model File"),
 *   field_types = {
 *     "file"
 *   }
 * )
 */
class DgiThreejsFileWidget extends FileWidget
{
    /**
     * @inheritDoc
     */
    public static function defaultSettings(): array
    {
        // TODO: Change how the preview settings are defined.
        // Some settings will be exposed to the user in the widget settings
        // form when the configurable camera work is done, and some will be
        // defined as default settings. The defaults should be defined in a way
        // that allows them to be retrieved by the formatter as well.
        $preview_settings = [
            'width' => '100%',
            'height' => '400px',
            'file_url' => '',
            'container_classes' => ['dgi-3d-viewer-canvas'],
            'progress_element_classes' => ['dgi-3d-viewer-progress'],
            'perspective_camera_settings' => [ // https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
                'fov' => 50,
                'near' => 0.1,
                'far' => 2000,
                'position' => [
                    'x' => 0, // left / right
                    'y' => 0, // up / down
                    'z' => 25, // forward / backward, 0 is center, which is likely inside the model.
                ],
                'rotation' => [
                    'x' => 0,
                    'y' => 0,
                    'z' => 0,
                ],
            ],
        ];
        return [
          'preview_settings' => $preview_settings
        ] + parent::defaultSettings();
    }

    /**
     * @inheritDoc
     */
    public static function process($element, FormStateInterface $form_state, $form)
    {
        $preview_settings = static::defaultSettings()['preview_settings'];
        // If file is uploaded, check if it is a supported format.
        if (!empty($element['#files'])) {
            $file = reset($element['#files']);
            $supported_formats = ['gltf', 'glb'];
            $file_ext = pathinfo($file->getFileUri(), PATHINFO_EXTENSION);
            if (!in_array($file_ext, $supported_formats)) {
                return parent::process($element, $form_state, $form);
            }
            else {
                // The file exists and is a supported format, so we can add the viewer.
                $preview_settings['file_url'] = $file->createFileUrl();
                // Define the preview container.
                $element['preview'] = [
                    '#theme' => 'container',
                    '#attributes' => [
                        'class' => $preview_settings['container_classes'],
                        'style' => 'width: ' . $preview_settings['width'] . '; height: ' . $preview_settings['height'] . ';',
                    ],
                ];
                $element['preview']['#children']['progress'] = [
                    '#type' => 'html_tag',
                    '#tag' => 'span',
                    '#value' => t('Rendering...'),
                    '#attributes' => [
                        'class' => $preview_settings['progress_element_classes'],
                    ],
                ];
            }
        }
        // Add the library and settings to the element.
        $element['#attached']['drupalSettings']['dgi3DViewer'] = $preview_settings;
        $element['#attached']['library'][] = 'dgi_3d_viewer/dgi_3d_viewer';
        return parent::process($element, $form_state, $form);
    }
}
