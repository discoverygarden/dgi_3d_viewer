<?php

namespace Drupal\dgi_3d_viewer\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\file\Plugin\Field\FieldFormatter\FileFormatterBase;
use Drupal\file\FileInterface;
use Drupal\Core\Field\EntityReferenceFieldItemListInterface;

/**
 * Plugin implementation of the 'dgi_threejs_file_formatter' formatter.
 *
 * @FieldFormatter(
 *   id = "dgi_threejs_file_formatter",
 *   label = @Translation("3D Model File"),
 *   field_types = {
 *     "file"
 *   }
 * )
 */
class DgiThreejsFileFormatter extends FileFormatterBase
{
    /**
     * @inheritDoc
     */
    public static function defaultSettings(): array
    {
        $viewer_settings = [
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
            'viewer_settings' => $viewer_settings
        ] + parent::defaultSettings();
    }

    /**
     * @inheritDoc
     */
    public function viewElements(FieldItemListInterface $items, $langcode): array
    {
        /**
         * Upstream class extensions and inheritance is a bit of a mess:
         *
         * This extends FileFormatterBase,
         * which extends EntityReferenceFormatterBase,
         * which extends FormatterBase,
         * which implements FormatterInterface.
         *
         * EntityReferenceFormatterBase has a getEntitiesToView() method,
         * which expects an EntityReferenceFieldItemListInterface, but
         * it doesn't override viewElements(), and neither does
         * FileFormatterBase. Type difference aren't affecting functionality.
         * It's just getting caught by static analysis, so casting the
         * $items argument to EntityReferenceFieldItemListInterface for now.
         * @see https://www.drupal.org/project/drupal/issues/3138528
         *
         * @var EntityReferenceFieldItemListInterface $items
         */
        $entities = parent::getEntitiesToView($items, $langcode);
        // If no entities load, or the first is not a FileInterface object,
        // return empty.
        if (empty($entities) || !($entities[0] instanceof FileInterface)) {
            return [];
        }

        // Get the file URL.
        $file_url = $entities[0]->createFileUrl();
        if ($file_url) {
            $viewer_settings = $this->getSetting('viewer_settings');
            $viewer_settings['file_url'] = $file_url;
            $this->setSetting('viewer_settings', $viewer_settings);
            $render_array = [
                '#type' => 'container',
                '#attributes' => [
                    'class' => $viewer_settings['container_classes'],
                ],
                '#children' => [
                    'progress' => [
                        '#type' => 'html_tag',
                        '#tag' => 'span',
                        '#value' => t('Rendering...'),
                        '#attributes' => [
                            'class' => $viewer_settings['progress_element_classes'],
                        ],
                    ],
                ],
            ];
            $render_array['#attached']['drupalSettings']['dgi3DViewer'] = $viewer_settings;
            $render_array['#attached']['library'][] = 'dgi_3d_viewer/dgi_3d_viewer';
            return $render_array;
        }
        return [];
    }
}