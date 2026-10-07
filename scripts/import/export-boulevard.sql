BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT jsonb_build_object(
 'exportedAt', now(),
 'complex', (SELECT to_jsonb(c) FROM complexes c WHERE id = '63b089e4-8ce6-424e-9022-a02df29f303c'),
 'projects', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.display_order,p.id) FROM projects p WHERE complex_id = '63b089e4-8ce6-424e-9022-a02df29f303c'), '[]'::jsonb),
 'buildings', COALESCE((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.project_id,b.display_order,b.id) FROM project_buildings b JOIN projects p ON p.id=b.project_id WHERE p.complex_id = '63b089e4-8ce6-424e-9022-a02df29f303c'), '[]'::jsonb),
 'floors', COALESCE((SELECT jsonb_agg(to_jsonb(f) ORDER BY f.project_id,f.building_id,f.floor_number,f.id) FROM floors f JOIN projects p ON p.id=f.project_id WHERE p.complex_id = '63b089e4-8ce6-424e-9022-a02df29f303c'), '[]'::jsonb),
 'units', COALESCE((SELECT jsonb_agg(to_jsonb(u) ORDER BY u.project_id,u.floor_id,u.unit_identifier,u.id) FROM units u JOIN projects p ON p.id=u.project_id WHERE p.complex_id = '63b089e4-8ce6-424e-9022-a02df29f303c'), '[]'::jsonb),
 'images', COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.project_id,i.order_index,i.id) FROM project_images i JOIN projects p ON p.id=i.project_id WHERE p.complex_id = '63b089e4-8ce6-424e-9022-a02df29f303c'), '[]'::jsonb)
);
COMMIT;
